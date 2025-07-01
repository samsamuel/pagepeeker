#!/usr/bin/env python3
import os
import shutil

SCREENSHOTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'screenshots'))

def clear_screenshots():
    if not os.path.exists(SCREENSHOTS_DIR):
        print(f"Screenshots directory does not exist: {SCREENSHOTS_DIR}")
        return
    for entry in os.listdir(SCREENSHOTS_DIR):
        entry_path = os.path.join(SCREENSHOTS_DIR, entry)
        if os.path.isdir(entry_path):
            shutil.rmtree(entry_path)
            print(f"Deleted: {entry_path}")
    print("All screenshots cleared.")

if __name__ == "__main__":
    clear_screenshots()
