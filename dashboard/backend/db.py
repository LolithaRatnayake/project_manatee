import sqlite3

def get_connection(system_name):
    """Establish a connection with dict-like row access."""
    db_path = f"../../agent/database.db"
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row 
    return conn

def get_latest_drift_status(system_name):
    """Retrieve all DRIFTED components from the most recent scan."""
    query = """
        SELECT Component, Requirement_ID, Issue_Description 
        FROM drift_reports 
        WHERE System_Name = ? 
          AND Status = 'DRIFTED'
          AND runtime = (
              SELECT MAX(runtime) 
              FROM drift_reports 
              WHERE System_Name = ?
          )
    """
    with get_connection(system_name) as conn:
        cursor = conn.cursor()
        cursor.execute(query, (system_name, system_name))
        return [dict(row) for row in cursor.fetchall()]

def get_drift_trend(system_name):
    """Get the count of drifted vs compliant components over time."""
    query = """
        SELECT runtime, Status, COUNT(Component) as Count
        FROM drift_reports
        WHERE System_Name = ?
        GROUP BY runtime, Status
        ORDER BY runtime ASC
    """
    with get_connection(system_name) as conn:
        cursor = conn.cursor()
        cursor.execute(query, (system_name,))
        return [dict(row) for row in cursor.fetchall()]