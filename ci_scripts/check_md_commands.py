import re
import shlex
import subprocess
import sys
from pathlib import Path


def run_bash_code_blocks(md_file: str) -> None:
    print(f"Running bash code blocks from: {md_file}")
    with Path(md_file).open() as f:
        content = f.read()

    # Match all blocks with an optional <!-- Check: Skip --> before
    pattern = re.compile(
        r"(<!--\s*Check:\s*Run\s*-->\s*)?"
        r"```bash(.*?)```",
        re.DOTALL | re.IGNORECASE,
    )

    matches = pattern.findall(content)
    for run_flag, block in matches:
        if not run_flag:
            continue

        print("Executing bash block:")
        for line in block.strip().split("\n"):
            line_striped = line.strip()
            if line_striped.startswith("#") or not line_striped:
                continue
            print(f"->  {line_striped}")
            try:
                subprocess.run(shlex.split(line_striped), check=True)  # noqa: S603
                print("Success")
            except subprocess.CalledProcessError as e:
                print(f"Failed: {e}")
                sys.exit(1)
            except ValueError as ve:
                print(f"Invalid command: {ve}")
                sys.exit(1)


def main() -> None:
    run_bash_code_blocks("docs/scripts.md")
    run_bash_code_blocks("README.md")


if __name__ == "__main__":
    main()
