"""Prompt templates for LLM interactions."""
from typing import Any, Dict, List, Optional


class PromptTemplates:
    """Collection of prompt templates."""
    
    # Input analysis prompts
    ANALYZE_CLARITY = """Analyze the following user input for clarity and completeness:

Input: "{input}"

Assess the input on these dimensions:
1. Clarity (0-100): How clear and unambiguous is the request?
2. Completeness (0-100): How much information is provided?
3. Ambiguities: List specific ambiguous terms or concepts
4. Missing Information: What critical information is missing?
5. Explicit Requirements: Any clear requirements stated?

Provide your analysis in JSON format:
{{
  "clarity_score": <0-100>,
  "completeness_score": <0-100>,
  "ambiguities": ["ambiguity1", "ambiguity2"],
  "missing_information": ["missing1", "missing2"],
  "explicit_requirements": ["req1", "req2"]
}}
"""

    # Intent classification prompts
    CLASSIFY_INTENT = """Classify the user's intent based on the conversation so far.

Initial Input: "{initial_input}"

Conversation History:
{conversation_history}

Classify into:
1. Primary Domain (e.g., sales, support, automation, testing, hr, finance, etc.)
2. Sub-domain (if applicable)
3. Problem Category
4. Confidence (0-1)

Return JSON:
{{
  "domain": "<domain>",
  "sub_domain": "<sub_domain or null>",
  "problem_category": "<category>",
  "confidence": <0-1>,
  "reasoning": "<brief explanation>"
}}

Focus on the most likely interpretation based on available information.
"""

    # Question generation prompts
    GENERATE_QUESTIONS = """Generate clarifying questions based on the current understanding.

Current Context:
- Initial Input: "{initial_input}"
- Extracted Facts: {facts}
- Current Domain Hypothesis: {domain}
- Confidence: {confidence}
- Information Gaps: {gaps}

Generate 1-3 high-value clarifying questions that will:
1. Resolve the most critical ambiguities
2. Fill important information gaps
3. Confirm or refine domain classification
4. Be concise and easy to answer

For each question, provide:
- The question text
- Question type (open_ended, multiple_choice, yes_no)
- Priority (critical, high, medium, low)
- What information it targets
- Expected information value (0-1)

Return JSON array:
[
  {{
    "text": "<question>",
    "type": "<type>",
    "priority": "<priority>",
    "targets": ["info1", "info2"],
    "information_value": <0-1>,
    "options": ["option1", "option2"] or null
  }}
]

Keep questions natural and conversational. Avoid redundancy with previous questions.
"""

    # Response processing prompts
    EXTRACT_INFORMATION = """Extract structured information from the user's response.

Question Asked: "{question}"
User Response: "{response}"

Current Context: {context}

Extract:
1. New facts and their confidence levels
2. Requirements mentioned
3. Constraints stated
4. Preferences indicated
5. Whether the response answers the question
6. Response informativeness (0-1)

Return JSON:
{{
  "facts": [{{"key": "<key>", "value": "<value>", "confidence": <0-1>}}],
  "requirements": ["req1", "req2"],
  "constraints": ["constraint1"],
  "answers_question": <true/false>,
  "informativeness": <0-1>,
  "contains_contradiction": <true/false>
}}
"""

    # Requirement synthesis prompts
    SYNTHESIZE_REQUIREMENTS = """Synthesize a complete requirements specification from the conversation.

Session Context:
- Domain: {domain}
- Initial Input: "{initial_input}"
- Extracted Facts: {facts}
- Conversation History: {history}

Generate:
1. Functional requirements
2. Non-functional requirements
3. Technical constraints
4. User stories (if applicable)
5. Success criteria
6. Executive summary

Return JSON:
{{
  "domain": "<domain>",
  "problem_category": "<category>",
  "executive_summary": "<summary>",
  "functional_requirements": [
    {{
      "description": "<desc>",
      "priority": "must_have|should_have|could_have",
      "confidence": <0-1>
    }}
  ],
  "non_functional_requirements": [...],
  "technical_constraints": ["constraint1"],
  "user_stories": ["As a..., I want..., so that..."],
  "success_criteria": ["criterion1"],
  "overall_confidence": <0-1>
}}
"""

    @classmethod
    def format_prompt(cls, template: str, **kwargs: Any) -> str:
        """Format a prompt template with variables.
        
        Args:
            template: Template string
            **kwargs: Variables to substitute
            
        Returns:
            Formatted prompt
        """
        return template.format(**kwargs)
    
    @classmethod
    def format_conversation_history(cls, turns: List[Dict[str, Any]]) -> str:
        """Format conversation history for prompts.
        
        Args:
            turns: List of conversation turns
            
        Returns:
            Formatted history string
        """
        if not turns:
            return "No conversation yet."
        
        lines = []
        for turn in turns:
            speaker = turn.get("speaker", "unknown")
            message = turn.get("message", "")
            lines.append(f"{speaker.upper()}: {message}")
        
        return "\n".join(lines)