import os
import yaml
from pathlib import Path

def read_adrs(system_path: str) -> str:
    """Reads all Markdown ADRs for a given system and concatenates them."""
    adr_dir = Path(system_path) / "adrs"
    if not adr_dir.exists():
        return "No ADRs found."

    compiled_adrs = []
    for file_path in sorted(adr_dir.glob("*.md")):
        with open(file_path, "r", encoding="utf-8") as f:
            compiled_adrs.append(f"--- ADR: {file_path.name} ---\n{f.read()}\n")
            
    return "\n".join(compiled_adrs)

def read_docker_compose(system_path: str) -> str:
    """Reads the docker-compose.yml file as a raw string."""
    compose_path = Path(system_path) / "docker-compose.yml"
    if not compose_path.exists():
        return "No docker-compose.yml found."

    with open(compose_path, "r", encoding="utf-8") as f:
        return f.read()
