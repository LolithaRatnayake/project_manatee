import os
import yaml
from datetime import datetime
from pathlib import Path

class FileUtil:
    def __init__(self, system_path: str):
        self.system_path = system_path

    def read_adrs(self) -> str:
        """Reads all Markdown ADRs for a given system and concatenates them."""
        adr_dir = Path(self.system_path) / "adrs"
        if not adr_dir.exists():
            return "No ADRs found."

        compiled_adrs = []
        for file_path in sorted(adr_dir.glob("*.md")):
            with open(file_path, "r", encoding="utf-8") as f:
                compiled_adrs.append(f"--- ADR: {file_path.name} ---\n{f.read()}\n")
                
        return "\n".join(compiled_adrs)

    def read_docker_compose(self) -> str:
        """Reads the docker-compose.yml file as a raw string."""
        compose_path = Path(self.system_path) / "docker-compose.yml"
        if not compose_path.exists():
            return "No docker-compose.yml found."

        with open(compose_path, "r", encoding="utf-8") as f:
            return f.read()

    def record_drifts(self, drifts: str) -> None:
        current_date = datetime.now().isoformat()
        output_file = Path(self.system_path) / "drifts"/ f'drift_detection_{current_date}.csv'
        try:
            with open(output_file, 'w') as record:
                record.write(drifts)
        except IOError:
            print('Error in recording drifts.')
