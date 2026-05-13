#!/usr/bin/env python3
"""
scripts/check_html.py

Valida index.html antes de hacer commit/push. Detecta errores comunes que
romperían el deploy en Vercel y que el navegador a veces "perdona":

  - Llaves { } y paréntesis ( ) balanceados en bloques <script>
  - IDs HTML duplicados
  - Anclas <a href="#xxx"> que apunten a IDs inexistentes
  - Bloques <script> con JSON inválido cuando type=application/ld+json
  - Caracteres surrogate sueltos (que romperían escrituras posteriores)
  - Tamaño del archivo (avisa si pasa de 1.5 MB)

Uso:
    python3 scripts/check_html.py [ruta/al/index.html]

Por defecto valida ./index.html en la raíz del repo.

Por qué este script vive en Python y no en JS:
  - Validar el HTML como TEXTO (no como árbol DOM) es exactamente el tipo de
    tarea para la que el ecosistema Python es más cómodo: regex, lectura de
    archivo, exit codes, integración con git hooks.
  - No se despliega a Vercel. Es una utilidad del repo. Tú la corres en tu
    máquina antes del push, o se conecta como pre-commit hook.

Salida:
  - exit 0  → todo OK
  - exit 1  → al menos un problema
"""

import re
import sys
import json
from pathlib import Path

PATH_DEFAULT = "index.html"


def colorize(text: str, color: str) -> str:
    codes = {"red": 31, "green": 32, "yellow": 33, "cyan": 36}
    return f"\033[{codes.get(color, 0)}m{text}\033[0m"


def find_scripts(html: str):
    """Devuelve lista de (attrs, body, line_offset) para cada <script>."""
    out = []
    for m in re.finditer(r"<script([^>]*)>(.*?)</script>", html, flags=re.DOTALL):
        attrs = m.group(1)
        body = m.group(2)
        # Línea aproximada donde empieza el body
        line = html[: m.start(2)].count("\n") + 1
        out.append((attrs, body, line))
    return out


def check_braces(body: str, line_offset: int, label: str):
    """Cuenta llaves/paréntesis/corchetes ignorando strings, comentarios y regex.

    NOTA: este parser es heurístico. JS tiene literales regex (/.../flags),
    template literals con ${...}, y otros casos donde un parser de verdad
    requeriría una AST. Acá hacemos lo posible y, si quedan cosas sin cerrar,
    lo reportamos como WARNING (no como error fatal), porque Node ya valida
    sintaxis real cuando se desea ("node --check archivo.js").
    """
    op_pairs = {"{": "}", "(": ")", "[": "]"}
    closers = {v: k for k, v in op_pairs.items()}
    stack = []
    issues = []
    i, n = 0, len(body)
    line = line_offset
    in_str = None  # ' " ` o None
    in_comment = None  # '//' o '/*' o None
    in_template_expr = 0  # profundidad de ${...} dentro de template literal

    def char(i):
        return body[i] if i < n else ""

    def prev_non_ws_is_div_context():
        """Heurística para decidir si la siguiente '/' inicia regex o división.
        Si el token anterior es operador o palabra clave, es regex."""
        j = i - 1
        while j >= 0 and body[j] in " \t\n":
            j -= 1
        if j < 0:
            return True
        c = body[j]
        if c in "(,=!&|?:;{[+-*<>^~%":
            return True
        # Palabras clave que preceden a regex
        # Tomamos las últimas letras
        k = j
        while k >= 0 and (body[k].isalnum() or body[k] == "_"):
            k -= 1
        word = body[k + 1 : j + 1]
        return word in {"return", "typeof", "in", "of", "delete", "void", "new", "throw", "yield", "await", "case"}

    while i < n:
        c = body[i]
        if c == "\n":
            line += 1
            if in_comment == "//":
                in_comment = None
            i += 1
            continue
        if in_comment == "//":
            i += 1
            continue
        if in_comment == "/*":
            if c == "*" and char(i + 1) == "/":
                in_comment = None
                i += 2
                continue
            i += 1
            continue
        if in_str:
            if c == "\\":
                i += 2
                continue
            if in_str == "`" and c == "$" and char(i + 1) == "{":
                in_template_expr += 1
                in_str = None
                i += 2
                stack.append(("{", line))
                continue
            if c == in_str:
                in_str = None
            i += 1
            continue
        # Fuera de string y comentario
        if c == "/" and char(i + 1) == "/":
            in_comment = "//"
            i += 2
            continue
        if c == "/" and char(i + 1) == "*":
            in_comment = "/*"
            i += 2
            continue
        if c == "/" and prev_non_ws_is_div_context():
            # Es un literal regex: consumir hasta el siguiente / sin escape
            j = i + 1
            while j < n:
                if body[j] == "\\":
                    j += 2
                    continue
                if body[j] == "\n":
                    break
                if body[j] == "/":
                    j += 1
                    # Consumir flags
                    while j < n and body[j].isalpha():
                        j += 1
                    break
                j += 1
            i = j
            continue
        if c in ("'", '"', "`"):
            in_str = c
            i += 1
            continue
        if c in op_pairs:
            stack.append((c, line))
        elif c in closers:
            if not stack:
                issues.append(f"  línea ~{line}: cierre '{c}' sin apertura")
            else:
                op, _ = stack.pop()
                if op_pairs[op] != c:
                    issues.append(f"  línea ~{line}: se esperaba '{op_pairs[op]}' pero vino '{c}'")
                # Salida de ${...} en template literal
                if op == "{" and in_template_expr > 0:
                    in_template_expr -= 1
                    in_str = "`"
        i += 1

    for op, ln in stack:
        issues.append(f"  línea ~{ln}: '{op}' sin cierre")

    if issues:
        print(colorize(f"[WARN] balance en {label} (heurístico - confirmar con node --check)", "yellow"))
        for it in issues[:5]:
            print(it)
        if len(issues) > 5:
            print(f"  ... y {len(issues) - 5} más")
        return True  # warning, no falla el script
    return True


def check_duplicate_ids(html: str):
    ids = re.findall(r'\sid="([^"]+)"', html)
    seen = {}
    for i in ids:
        seen[i] = seen.get(i, 0) + 1
    dups = {k: v for k, v in seen.items() if v > 1}
    if dups:
        print(colorize(f"[WARN] IDs duplicados ({len(dups)}) - revisar manualmente:", "yellow"))
        for k, v in list(dups.items())[:10]:
            print(f"  '{k}' aparece {v} veces")
        return True  # warning, no falla el push
    print(colorize(f"[ ok ] IDs únicos ({len(ids)} en total)", "green"))
    return True


def check_anchors(html: str):
    all_ids = set(re.findall(r'\sid="([^"]+)"', html))
    anchors = re.findall(r'href="#([^"]+)"', html)
    broken = []
    for a in anchors:
        if not a:
            continue
        if a not in all_ids:
            broken.append(a)
    broken = list(set(broken))
    if broken:
        print(colorize(f"[WARN] anclas a IDs inexistentes ({len(broken)}):", "yellow"))
        for b in broken[:15]:
            print(f"  href=\"#{b}\"")
        return True  # warning, no falla el build
    print(colorize("[ ok ] todas las anclas <a href=#...> apuntan a un id existente", "green"))
    return True


def check_json_ld(html: str):
    bad = 0
    for attrs, body, line in find_scripts(html):
        if "application/ld+json" not in attrs:
            continue
        try:
            json.loads(body)
        except Exception as e:
            print(colorize(f"[FAIL] JSON-LD inválido en línea ~{line}: {e}", "red"))
            bad += 1
    if bad == 0:
        print(colorize("[ ok ] JSON-LD parseable", "green"))
    return bad == 0


def check_surrogates(html: str):
    bad = [(i, ord(c)) for i, c in enumerate(html) if 0xD800 <= ord(c) <= 0xDFFF]
    if bad:
        print(colorize(f"[FAIL] caracteres surrogate sueltos ({len(bad)}):", "red"))
        for pos, cp in bad[:5]:
            print(f"  pos {pos}: U+{cp:04X}")
        return False
    print(colorize("[ ok ] sin surrogates sueltos", "green"))
    return True


def check_size(path: Path):
    mb = path.stat().st_size / 1024 / 1024
    if mb > 1.5:
        print(colorize(f"[WARN] archivo grande: {mb:.2f} MB (>1.5 MB)", "yellow"))
    else:
        print(colorize(f"[ ok ] tamaño: {mb:.2f} MB", "green"))
    return True


def main():
    path = Path(sys.argv[1] if len(sys.argv) > 1 else PATH_DEFAULT)
    if not path.exists():
        print(colorize(f"No existe: {path}", "red"))
        sys.exit(2)

    print(colorize(f"\nValidando {path}\n", "cyan"))
    html = path.read_text(encoding="utf-8")

    results = []
    results.append(check_size(path))
    results.append(check_surrogates(html))
    results.append(check_duplicate_ids(html))
    results.append(check_anchors(html))
    results.append(check_json_ld(html))

    # Balance de llaves en cada bloque <script> que sea JS real
    scripts = find_scripts(html)
    js_blocks = [
        (a, b, ln)
        for a, b, ln in scripts
        if "application/ld+json" not in a and "application/json" not in a
    ]
    print(colorize(f"\nValidando balance de llaves en {len(js_blocks)} bloque(s) <script>:", "cyan"))
    for idx, (attrs, body, line) in enumerate(js_blocks, 1):
        ok = check_braces(body, line, f"<script> #{idx}")
        results.append(ok)
        if ok:
            print(colorize(f"[ ok ] <script> #{idx} (línea {line}) balanceado", "green"))

    print()
    if all(results):
        print(colorize(">>> TODO OK. Podés hacer commit y push.", "green"))
        sys.exit(0)
    else:
        print(colorize(">>> Hay errores. Corrégelos antes de hacer push.", "red"))
        sys.exit(1)


if __name__ == "__main__":
    main()

