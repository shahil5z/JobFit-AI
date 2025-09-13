document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const uploadSection = document.getElementById('upload-section');
  const matchSection = document.getElementById('match-section');
  const resultsSection = document.getElementById('results');
  const resumeUpload = document.getElementById('resume-upload');
  const saveResumeBtn = document.getElementById('save-resume');
  const matchBtn = document.getElementById('match-btn');
  const tryAnotherResumeBtn = document.getElementById('try-another-resume');
  const newAnalysisBtn = document.getElementById('new-analysis');
  const uploadArea = document.getElementById('upload-area');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const removeFileBtn = document.getElementById('remove-file');
  const loadingOverlay = document.getElementById('loading-overlay');
  const scoreValue = document.getElementById('score-value');
  const scoreExplanation = document.getElementById('score-explanation');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  // Check if resume exists
  chrome.storage.local.get(['resume'], (result) => {
    if (result.resume) {
      uploadSection.style.display = 'none';
      matchSection.style.display = 'block';
    }
  });
  
  // Drag and drop functionality
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.add('dragover');
    }, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => {
      uploadArea.classList.remove('dragover');
    }, false);
  });
  
  uploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }
  
  resumeUpload.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });
  
  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      fileName.textContent = file.name;
      fileInfo.style.display = 'flex';
      uploadArea.style.display = 'none';
    }
  }
  
  removeFileBtn.addEventListener('click', () => {
    resumeUpload.value = '';
    fileInfo.style.display = 'none';
    uploadArea.style.display = 'block';
  });
  
  // Save resume
  saveResumeBtn.addEventListener('click', () => {
    const file = resumeUpload.files[0];
    if (!file) {
      showNotification('Please select a file first', 'warning');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      chrome.storage.local.set({resume: e.target.result}, () => {
        showNotification('Resume saved successfully!', 'success');
        uploadSection.style.display = 'none';
        matchSection.style.display = 'block';
      });
    };
    reader.readAsText(file);
  });
  
  // Try another resume
  tryAnotherResumeBtn.addEventListener('click', () => {
    chrome.storage.local.remove('resume', () => {
      resumeUpload.value = ''; // Clear file input
      fileInfo.style.display = 'none'; // Hide file info
      uploadArea.style.display = 'block'; // Show upload area
      matchSection.style.display = 'none'; // Hide match section
      uploadSection.style.display = 'block'; // Show upload section
      showNotification('Previous resume removed. Please upload a new resume.', 'success');
    });
  });
  
  // Match resume
  matchBtn.addEventListener('click', async () => {
    showLoading(true);
    
    try {
      // Get selected text from active tab
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const results = await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: getSelectedText
      });
      
      let jobDescription = results[0]?.result || null;  // Safely handle null/undefined
      
      // Debug log (check in popup console)
      console.log('Selected Job Description:', jobDescription);
      
      if (!jobDescription) {
        showNotification('No text selected. Please go to a job page, select the job description text (e.g., Ctrl+A or highlight it), then try again.', 'warning');
        showLoading(false);
        return;
      }
      
      jobDescription = jobDescription.trim();
      if (jobDescription.length < 50) {  // Minimal length check
        showNotification('Selected text is too short. Please select more of the job description (at least 50 characters).', 'warning');
        showLoading(false);
        return;
      }
      
      // Get stored resume
      const {resume} = await chrome.storage.local.get('resume');
      if (!resume) {
        showNotification('No resume saved. Please upload and save your resume first.', 'warning');
        showLoading(false);
        return;
      }
      
      // Send to backend
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({resume, job_description: jobDescription})
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      displayResults(data);
      
    } catch (error) {
      console.error('Match error:', error);  // Debug log
      showNotification(`Error: ${error.message}`, 'error');
    } finally {
      showLoading(false);
    }
  });
  
  // New analysis
  newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    matchSection.style.display = 'block';
  });
  
  // Tab functionality
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      // Deactivate all tabs
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));
      
      // Activate selected tab
      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
  
  function displayResults(data) {
    if (data.error) {
      showNotification(`Analysis error: ${data.error}`, 'error');
      return;
    }
    
    // Parse score
    const scoreMatch = data['ATS Match Score'].match(/(\d+)\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    // Update score display
    scoreValue.textContent = score;
    scoreExplanation.textContent = data['ATS Match Score'];
    
    // Update score circle
    document.documentElement.style.setProperty('--score-percentage', `${score}%`);
    
    // Update strengths
    const strengthsList = document.getElementById('strengths-list');
    strengthsList.innerHTML = '';
    data.Strengths.forEach(strength => {
      const li = document.createElement('li');
      li.textContent = strength;
      strengthsList.appendChild(li);
    });
    
    // Update keywords
    const matchedKeywordsList = document.getElementById('matched-keywords-list');
    matchedKeywordsList.innerHTML = '';
    data['Matched Keywords'].forEach(keyword => {
      const span = document.createElement('span');
      span.className = 'keyword';
      span.textContent = keyword;
      matchedKeywordsList.appendChild(span);
    });
    
    const missingKeywordsList = document.getElementById('missing-keywords-list');
    missingKeywordsList.innerHTML = '';
    data['Missing Keywords'].forEach(keyword => {
      const span = document.createElement('span');
      span.className = 'keyword';
      span.textContent = keyword;
      missingKeywordsList.appendChild(span);
    });
    
    // Update gaps
    const gapsList = document.getElementById('gaps-list');
    gapsList.innerHTML = '';
    data['Gaps & Weaknesses'].forEach(gap => {
      const li = document.createElement('li');
      li.textContent = gap;
      gapsList.appendChild(li);
    });
    
    // Update suggestions
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';
    data['Suggestions for Improvement'].forEach(suggestion => {
      const li = document.createElement('li');
      li.textContent = suggestion;
      suggestionsList.appendChild(li);
    });
    
    // Update verdict
    document.getElementById('verdict-text').textContent = data['Overall Verdict'];
    
    // Show results
    matchSection.style.display = 'none';
    resultsSection.style.display = 'block';
    
    showNotification('Analysis complete! Check the results below.', 'success');
  }
  
  function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
  }
  
  function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-times-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
  // Simple function to get selected text (injected into the page)
  function getSelectedText() {
    return window.getSelection().toString();
  }
});