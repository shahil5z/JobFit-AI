from flask import Flask, request, jsonify
from flask_cors import CORS
import openai
import os
from dotenv import load_dotenv
import time
import json

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route('/analyze', methods=['POST'])
def analyze():
    start_time = time.time()
    data = request.json
    resume = data.get('resume', '')
    job_desc = data.get('job_description', '')
    
    # Truncate if too long to avoid timeout (increased slightly for more context)
    max_length = 12000
    if len(resume) > max_length:
        resume = resume[:max_length] + "...[truncated]"
    if len(job_desc) > max_length:
        job_desc = job_desc[:max_length] + "...[truncated]"
    
    prompt = f"""
    You are JobFit AI, an advanced ATS (Applicant Tracking System) assistant powered by expert-level analysis. Your goal is to provide a highly accurate, objective comparison between the provided resume and job description. Focus on factual alignments, quantifiable matches, and realistic assessments to achieve 99% accuracy in your evaluation.

    Key Guidelines for Analysis:
    - **ATS Match Score**: Calculate a score out of 100 based on:
      - Keyword match: 40% (overlap in skills, tools, technologies).
      - Experience alignment: 30% (years of experience, roles, achievements matching requirements).
      - Education and certifications: 10%.
      - Soft skills and other factors: 10%.
      - Overall fit: 10% (cultural/holistic match).
      Provide the score as "X/100" followed by " – " and a concise, evidence-based explanation (1-2 sentences) citing specific examples from resume and job desc.
    - **Strengths**: List 3-5 specific, evidence-based alignment points. Each should reference exact elements from resume and job desc (e.g., "Resume's 5 years in Python development directly matches the job's requirement for 3+ years in backend programming").
    - **Matched Keywords**: Extract 10-15 exact keywords/phrases that appear in both resume and job desc (e.g., "Python", "REST API", "Agile methodology"). Prioritize technical skills, tools, and domain-specific terms. Avoid duplicates.
    - **Missing Keywords**: Extract 5-10 keywords/phrases from job desc that are absent or weakly represented in resume. Focus on critical requirements.
    - **Gaps & Weaknesses**: List 3-5 specific shortcomings with evidence (e.g., "Resume lacks mention of cloud computing experience, which is required for AWS deployment in the job desc"). Be constructive and accurate.
    - **Suggestions for Improvement**: Provide 3-5 actionable, specific tips to address gaps (e.g., "Add quantifiable achievements from past roles, such as 'Led a team to reduce load times by 40%' to strengthen project management evidence").
    - **Overall Verdict**: A 1-paragraph (4-6 sentences) professional summary. Start with the score summary, highlight key strengths and gaps, end with recommendation (e.g., strong apply, apply with tweaks, or reconsider). Be balanced and data-driven.

    Example Output Structure (do not deviate):
    {{
      "ATS Match Score": "85/100 – Strong keyword overlap in Python and SQL, but minor gap in cloud experience reduces score slightly.",
      "Strengths": ["Strength 1 with evidence", "Strength 2 with evidence"],
      "Matched Keywords": ["keyword1", "keyword2"],
      "Missing Keywords": ["keyword1", "keyword2"],
      "Gaps & Weaknesses": ["Gap 1 with evidence", "Gap 2 with evidence"],
      "Suggestions for Improvement": ["Tip 1 specific and actionable", "Tip 2 specific and actionable"],
      "Overall Verdict": "Paragraph summary here."
    }}

    Ensure 99% accuracy by:
    - Double-checking all matches against exact text.
    - Avoiding assumptions—base everything on provided content.
    - Being objective: No hype or downplaying.
    - Returning ONLY valid JSON—no extra text.

    RESUME:
    {resume}

    JOB DESCRIPTION:
    {job_desc}
    """

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-turbo",
            messages=[{"role": "system", "content": "You are a precise ATS analyzer."}, {"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=1500,
            request_timeout=30
        )
        result_text = response.choices[0].message['content']
        
        try:
            result = json.loads(result_text)
        except json.JSONDecodeError:
            # Fallback: Attempt to extract JSON if malformed
            try:
                json_start = result_text.find('{')
                json_end = result_text.rfind('}') + 1
                result = json.loads(result_text[json_start:json_end])
            except:
                return jsonify({"error": "Invalid JSON response from AI"}), 500
        
        # Calculate processing time
        processing_time = time.time() - start_time
        print(f"Processing time: {processing_time:.2f} seconds")
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, threaded=True)