import os, functools
ROOT = "/Users/aadityanilesiphone/Documents/GitHub/demo2/ZionEnergy/platform"
os.chdir(ROOT)
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
H = functools.partial(SimpleHTTPRequestHandler, directory=ROOT)
ThreadingHTTPServer(("127.0.0.1", 8787), H).serve_forever()
