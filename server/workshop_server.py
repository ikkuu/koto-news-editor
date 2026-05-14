"""
kotoedit ワークショップ用ローカルサーバー

役割:
- docs/ を静的配信（参加者がスマホでkotoeditにアクセス）
- POST /api/submit で参加者からのEDL JSONを受信、data/{日付}/submissions.jsonl に追記
- /dashboard で集計画面を表示
- GET /api/submissions で全提出を返す

起動:
    python server/workshop_server.py
または start_workshop.bat をダブルクリック

依存: Python 3.8+ のみ（標準ライブラリ）
"""

import datetime
import json
import socket
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
DASHBOARD_DIR = ROOT / "server"
DATA_DIR = ROOT / "data"
PORT = 8080

MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".m4a": "audio/mp4",
    ".webp": "image/webp",
}


def today_dir() -> Path:
    d = DATA_DIR / datetime.date.today().isoformat()
    d.mkdir(parents=True, exist_ok=True)
    return d


def list_submissions() -> list[dict]:
    """全日付のsubmissions.jsonlを読み込んで返す。"""
    out: list[dict] = []
    if not DATA_DIR.exists():
        return out
    for date_dir in sorted(DATA_DIR.iterdir()):
        if not date_dir.is_dir():
            continue
        log = date_dir / "submissions.jsonl"
        if not log.exists():
            continue
        for line in log.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                rec["_date"] = date_dir.name
                out.append(rec)
            except json.JSONDecodeError:
                continue
    return out


def get_local_ip() -> str:
    """LAN内で参加者が接続するためのIPを取得。"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {fmt % args}")

    def _send(self, status: int, body: bytes, content_type: str, extra_headers: dict | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        # CORS（同一オリジン配信が基本だが、開発中の利便性のため許可）
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        for k, v in (extra_headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _send_json(self, obj, status: int = 200) -> None:
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self._send(status, body, "application/json; charset=utf-8")

    def _send_file(self, path: Path) -> None:
        if not path.exists() or not path.is_file():
            self._send(404, b"Not Found", "text/plain; charset=utf-8")
            return
        suffix = path.suffix.lower()
        content_type = MIME.get(suffix, "application/octet-stream")
        body = path.read_bytes()
        self._send(200, body, content_type)

    def do_OPTIONS(self) -> None:
        self._send(204, b"", "text/plain")

    def do_GET(self) -> None:
        path = urlparse(self.path).path

        # 集計API
        if path == "/api/submissions":
            self._send_json(list_submissions())
            return

        # ダッシュボード
        if path == "/dashboard" or path == "/dashboard/":
            self._send_file(DASHBOARD_DIR / "dashboard.html")
            return
        if path.startswith("/dashboard/"):
            rel = path[len("/dashboard/"):]
            self._send_file(DASHBOARD_DIR / rel)
            return

        # ルート / kotoedit本体
        if path == "/" or path == "":
            self._send_file(DOCS_DIR / "index.html")
            return
        rel = path.lstrip("/")
        self._send_file(DOCS_DIR / rel)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        if path != "/api/submit":
            self._send(404, b"Not Found", "text/plain; charset=utf-8")
            return

        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0 or length > 1024 * 1024:  # 1MB上限
            self._send_json({"error": "invalid content length"}, status=400)
            return

        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            self._send_json({"error": f"invalid json: {e}"}, status=400)
            return

        name = (payload.get("name") or "").strip() or "anonymous"
        clips = payload.get("clips") or []
        if not isinstance(clips, list):
            self._send_json({"error": "clips must be list"}, status=400)
            return

        record = {
            "name": name,
            "timestamp": datetime.datetime.now().isoformat(timespec="seconds"),
            "clips": clips,
        }
        log = today_dir() / "submissions.jsonl"
        with log.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")

        self._send_json({"ok": True, "saved_at": record["timestamp"]})


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    ip = get_local_ip()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("=" * 60)
    print(f" kotoedit ワークショップサーバー起動")
    print("=" * 60)
    print(f"  参加者用URL : http://{ip}:{PORT}/")
    print(f"  ダッシュボード: http://{ip}:{PORT}/dashboard")
    print(f"  データ保存先 : {DATA_DIR}")
    print(f"  停止       : Ctrl+C")
    print("=" * 60)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n停止します")
        server.server_close()


if __name__ == "__main__":
    sys.exit(main())
