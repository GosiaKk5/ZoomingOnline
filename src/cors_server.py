import argparse
import http.server
import socketserver


class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def run_server(port: int) -> None:
    with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
        print(f"Serving at http://localhost:{port} with CORS enabled")
        httpd.serve_forever()


def main() -> None:
    parser = argparse.ArgumentParser(description="Simple HTTP server with CORS support")
    parser.add_argument("--port", "-p", type=int, default=8000, help="Port number to run the server on (default: 8000)")
    args = parser.parse_args()
    run_server(args.port)


if __name__ == "__main__":
    main()
