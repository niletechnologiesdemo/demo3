import http.server, socketserver, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", 8080), http.server.SimpleHTTPRequestHandler) as h:
    print("serving on http://localhost:8080")
    h.serve_forever()
