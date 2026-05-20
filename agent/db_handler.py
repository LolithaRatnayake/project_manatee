import sqlite3
from datetime import datetime
import csv
import io


def prepare_report(report: str) -> list:
    """
    prepares report to insert into db
    returns: List of tuples/lists containing [Requirement_ID, Component, Status, Issue_Description].
    """
    csv_data = report.replace('```csv', '').replace('```', '').strip()
    try:
        # 2. Treat the string as a file and parse it
        f = io.StringIO(csv_data)
        reader = csv.reader(f)
        next(reader, None) # Skip header row
        
        # 3. Validate rows before handing them to the DB handler
        valid_rows = []
        for row in reader:
            if len(row) == 4:
                valid_rows.append(row)
            else:
                print(f"[!] Warning: Skipping malformed row from LLM: {row}")
            
    except Exception as e:
        print(f"[!] Error parsing or saving data: {e}")
        print("Raw response was:")
        print(csv_data)

    return valid_rows



def insert_drift_report(db_path: str, system_name: str, report: str):
    """
    Inserts a list of parsed CSV rows into the drift_reports table.
    
    Args:
        db_path: Path to the SQLite database.
        system_name: Name of the system being scanned.
        report: Response csv from llm.
    """
    valid_rows = prepare_report(report)

    runtime = datetime.now().isoformat()

    # Prepend the runtime and system_name to each row extracted from the LLM
    rows_to_insert = [
        (runtime, system_name, row[0], row[1], row[2], row[3]) 
        for row in valid_rows
    ]
    
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        
        # Execute bulk insertion
        cursor.executemany('''
            INSERT INTO drift_reports 
            (runtime, System_Name, Requirement_ID, Component, Status, Issue_Description)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', rows_to_insert)
        
        conn.commit()
        print(f"[*] Success! Inserted {len(rows_to_insert)} records into {db_path}")