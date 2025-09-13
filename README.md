**JobFit AI**
--------

JobFit AI is a browser extension that leverages AI to analyze and match your resume against job descriptions. It provides detailed insights into how well your resume fits a job posting, including match scores, strengths, gaps, keywords, and improvement suggestions. The extension uses OpenAI's GPT-4 Turbo model for accurate, data-driven evaluations, helping job seekers optimize their applications.

This project consists of a Flask backend for AI processing and a Chrome extension frontend for user interaction.

## Extension UI
-![image alt](https://github.com/shahil5z/JobFit-AI/blob/9817f489dab973748f337854211e5de80403f5f1/Sample%20Image/main%20ui.png)

Features
--------

-   **Resume Upload and Storage**: Securely upload and save your resume (TXT, PDF, DOCX) in browser storage.
-   **Job Description Analysis**: Select job description text from any webpage and analyze its match with your saved resume.
-   **AI-Powered Insights**:
    -   ATS Match Score (out of 100) with explanations.
    -   Strengths: Key alignments between resume and job description.
    -   Matched and Missing Keywords: Extracted from both documents.
    -   Gaps & Weaknesses: Identified shortcomings.
    -   Suggestions for Improvement: Actionable tips to enhance your resume.
    -   Overall Verdict: A balanced summary and recommendation.
-   **Interactive UI**: Modern popup interface with tabs, score visualization, and notifications.
-   **Secure and Local**: Resume is stored locally in Chrome storage; analysis is processed via a local Flask backend.
-   **Cross-Origin Support**: Handles CORS for seamless communication between extension and backend.

Technologies Used
-----------------

-   **Backend**:
    -   Python with Flask
    -   OpenAI API (GPT-4 Turbo)
    -   Libraries: Flask, Flask-CORS, python-dotenv, openai
-   **Frontend (Extension)**:
    -   HTML, CSS, JavaScript
    -   Font Awesome for icons
    -   Chrome Extension APIs (storage, scripting, activeTab)
-   **Other**:
    -   dotenv for environment variables (e.g., OpenAI API key)
    -   MIT License

Installation
------------

### Prerequisites

-   Python 3.8+ for the backend.
-   Google Chrome browser for the extension.
-   An OpenAI API key (sign up at [platform.openai.com](https://platform.openai.com)).

### Step 1: Set Up the Backend

1.  Clone the repository:

    text

    ```
    git clone https://github.com/yourusername/jobfit-ai.git
    cd jobfit-ai/backend
    ```

2.  Install dependencies:

    text

    ```
    pip install -r requirements.txt
    ```

3.  Create a .env file in the backend folder and add your OpenAI API key:

    text

    ```
    OPENAI_API_KEY=your_openai_api_key_here
    ```

4.  Run the Flask server:

    text

    ```
    python app.py
    ```

    The backend will run on http://localhost:5000.

### Step 2: Install the Chrome Extension

1.  Open Google Chrome or any other Browser and navigate to chrome://extensions/.
2.  Enable "Developer mode" in the top right.
3.  Click "Load unpacked" and select the extension folder from the project.
4.  The JobFit AI extension should now appear in your extensions list.

Usage
-----

1.  **Upload Resume**:
    -   Click the extension icon to open the popup.
    -   Drag & drop or browse to upload your resume.
    -   Click "Save Resume" to store it locally.
2.  **Analyze Job Match**:
    -   Navigate to a job posting webpage (e.g., LinkedIn, Indeed).
    -   Select the job description text (highlight or Ctrl+A).
    -   In the extension popup, click "Match My Resume".
    -   Wait for the analysis (processed via the backend).
3.  **View Results**:
    -   See the match score visualization.
    -   Navigate tabs for Strengths, Keywords, Gaps, and Suggestions.
    -   Read the Overall Verdict for a summary.
4.  **Additional Actions**:
    -   "Try Another Resume": Remove saved resume and upload a new one.
    -   "New Analysis": Reset for another job description.

**Note**: Ensure the backend server is running for analysis to work. The extension communicates with http://localhost:5000/analyze.

Development Notes
-----------------

-   **Backend**:
    -   The Flask app truncates long inputs to avoid timeouts.
    -   Uses a custom prompt for OpenAI to ensure structured JSON output.
    -   Error handling for invalid JSON responses.
-   **Extension**:
    -   Uses Chrome scripting to get selected text from the active tab.
    -   Stores resume in chrome.storage.local for persistence.
    -   Handles drag-and-drop, file uploads, and notifications.
    -   UI is responsive and fixed to 450x600px for popup consistency.
-   **Icons**: Three sizes (16px, 48px, 128px) are provided in extension/icons.
-   **Limitations**:
    -   Resume must be text-readable (PDF/DOCX parsing assumes plain text; complex formats may need conversion).
    -   Analysis is based on text content; no image or layout processing.
    -   OpenAI API usage may incur costs based on your plan.
 
License
-----------------
This project is licensed under the MIT License - see the LICENSE file for details.
