# Create a temporary build environment similar to snapcraft
mkdir -p /tmp/edge-build-test
cd /tmp/edge-build-test
cp -r ~/repo/todoforai/edge/* .

# Install dependencies like snapcraft would
python3 -m pip install --upgrade pip
pip install -r requirements.txt
pip install -e .
pip install PyInstaller

# Test the exact commands from snapcraft
echo "=== Starting sidecar build ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python3 --version)"
echo "PyInstaller version: $(python3 -m PyInstaller --version)"
echo "Available files:"
ls -la
echo "Checking ws_sidecar.py:"
ls -la edge_frontend/src-tauri/resources/python/ws_sidecar.py || echo "ws_sidecar.py not found!"

# Try the build
make build-sidecar 2>&1