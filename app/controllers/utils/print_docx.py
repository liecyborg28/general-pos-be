import sys
import subprocess

def print_docx(docx_path):
    command = f'libreoffice --headless --print "{docx_path}"'
    subprocess.run(command, shell=True)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python print_docx.py <path_to_docx>")
        sys.exit(1)

    docx_path = sys.argv[1]
    print_docx(docx_path)
