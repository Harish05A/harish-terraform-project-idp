import sys
import os

# Ensure this service's directory is importable for shared/ resolution.
_service_dir = os.path.dirname(os.path.abspath(__file__))
if _service_dir not in sys.path:
    sys.path.insert(0, _service_dir)
