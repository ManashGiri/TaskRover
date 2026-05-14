import time

class MockAIService:
    """
    A dedicated service module to simulate AI processing for field operations.
    """
    
    @staticmethod
    def generate_analysis(task_title, notes):
        time.sleep(1)

        if not notes or len(notes.strip()) < 10:
            return {
                "summary": "Agent provided insufficient documentation for the completed task.",
                "risk_flag": "🔴 HIGH - Missing Documentation",
                "recommendation": "Flag for Auditor review. Request agent resubmit detailed notes."
            }

        lower_notes = notes.lower()

        risk = "🟢 LOW"
        recommendation = "No further action required. Task is ready for Auditor verification."
        
        if any(word in lower_notes for word in ["issue", "broken", "failed", "error", "delay"]):
            risk = "🟡 MEDIUM - Potential hardware/system instability"
            recommendation = "Schedule a follow-up maintenance check within 14 days."
            
        return {
            "summary": f"Agent successfully executed '{task_title}'. Logged details: {notes[:50]}...",
            "risk_flag": risk,
            "recommendation": recommendation
        }