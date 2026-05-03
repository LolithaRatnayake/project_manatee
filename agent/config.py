import os
from dotenv import load_dotenv

# Load environment variables from the .env file located at the project root
load_dotenv()

class Config:
    """Centralized configuration for the Drift Detection Agent."""
    
    # ---------------------------------------------------------
    # LLM Configuration
    # ---------------------------------------------------------
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Using gemini-1.5-pro for complex reasoning and context windows
    # MODEL_NAME = "gemini-1.5-pro"
    MODEL_NAME = "gemini-2.5-flash"
    
    # Low temperature ensures the agent is analytical and consistent, 
    # rather than creative, which is ideal for architecture governance.
    TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    
    # ---------------------------------------------------------
    # Application Settings
    # ---------------------------------------------------------
    DEFAULT_SYSTEM = os.getenv("DEFAULT_SYSTEM", "ticketing_system")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate(cls):
        """Validates that all required environment variables are present."""
        if not cls.GEMINI_API_KEY or cls.GEMINI_API_KEY == "your_api_key_here":
            raise ValueError(
                "CRITICAL ERROR: GEMINI_API_KEY is missing or invalid. "
                "Please check your .env file."
            )

# Execute validation immediately when the config module is imported
Config.validate()