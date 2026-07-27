"""下载 GitHub 头像到 public/favicon.png"""

import urllib.request
import os

AVATAR_URL = "https://avatars.githubusercontent.com/u/30829895"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "favicon.png")


def main():
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    urllib.request.urlretrieve(AVATAR_URL, OUTPUT_PATH)
    print(f"Avatar downloaded to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
