import sys
from pathlib import Path

# Add the project root directory to the Python path
# This allows tests to import modules from the 'src' directory
project_root = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(project_root))
