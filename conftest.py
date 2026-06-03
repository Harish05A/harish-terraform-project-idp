"""
Root conftest.py — fixes module collision for monorepo Lambda services.

Problem: All three services (cart, order, product) each have a file called
lambda_function.py.  Their test files all do `import lambda_function as lf`
at the top level.  When pytest collects all three test directories in one run,
whichever service's lambda_function.py gets imported first ends up cached in
sys.modules['lambda_function'], and the other two test suites then import the
wrong module — causing AttributeError on monkeypatched attributes.

Fix: Before every test, swap sys.modules['lambda_function'] to the module
that belongs to the service being tested (identified by the test file's
directory).  After the test, restore the previous value so the next test
sees its own correct module.

No test files, no handlers, no business logic is modified.
"""

import sys
import os
import importlib.util
import pytest

# ── Pre-load each service's lambda_function as a named module object ──────────

def _load_service_module(service_name: str) -> object:
    """Import lambda_function.py from a given backend service directory."""
    root = os.path.dirname(os.path.abspath(__file__))
    service_dir = os.path.join(root, "backend", service_name)
    lf_path = os.path.join(service_dir, "lambda_function.py")

    # The lambda_function files use sys.path.append to reach shared/, so the
    # service directory must be on sys.path before we exec the module.
    if service_dir not in sys.path:
        sys.path.insert(0, service_dir)

    module_key = f"_service_lambda_{service_name}"
    if module_key in sys.modules:
        return sys.modules[module_key]

    spec = importlib.util.spec_from_file_location(module_key, lf_path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[module_key] = mod   # register before exec to handle circular refs
    spec.loader.exec_module(mod)
    return mod


# Load all three service modules once at collection time.
_SERVICE_MODULES = {
    "cart":    _load_service_module("cart"),
    "order":   _load_service_module("order"),
    "product": _load_service_module("product"),
}

# Map each test file name to its service module.
_TEST_FILE_TO_SERVICE = {
    "test_cart_lambda.py":    "cart",
    "test_order_lambda.py":   "order",
    "test_product_lambda.py": "product",
}


# ── pytest hook: swap sys.modules['lambda_function'] before each test ─────────

@pytest.fixture(autouse=True)
def _isolate_lambda_module(request):
    """
    Ensure sys.modules['lambda_function'] points to the correct service module
    for the currently running test.  Restores the previous value afterwards.
    """
    test_file = os.path.basename(request.fspath)
    service = _TEST_FILE_TO_SERVICE.get(test_file)

    if service is None:
        yield
        return

    correct_module = _SERVICE_MODULES[service]
    previous = sys.modules.get("lambda_function")

    # Point the global import alias at the right module.
    sys.modules["lambda_function"] = correct_module

    # Also fix the reference inside the test module itself: `import lambda_function as lf`
    # created a local binding in the test module's namespace.  Update it so
    # monkeypatch.setattr(lf, ...) targets the correct object.
    test_module = sys.modules.get(request.module.__name__)
    if test_module is not None and hasattr(test_module, "lf"):
        test_module.lf = correct_module

    yield

    # Restore — lets the next test's fixture see the right module too.
    if previous is None:
        sys.modules.pop("lambda_function", None)
    else:
        sys.modules["lambda_function"] = previous
