chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "SHOW_POPUP") {
        // Check if popup already exists
        if (document.getElementById('phisheye-popup')) return;

        // Create container
        const div = document.createElement('div');
        div.id = 'phisheye-popup';
        div.style.position = 'fixed';
        div.style.top = '20px';
        div.style.right = '20px';
        div.style.zIndex = '999999';
        div.style.padding = '20px';
        div.style.backgroundColor = request.status === 'Safe' ? '#d4edda' : '#f8d7da';
        div.style.color = request.status === 'Safe' ? '#155724' : '#721c24';
        div.style.border = '1px solid ' + (request.status === 'Safe' ? '#c3e6cb' : '#f5c6cb');
        div.style.borderRadius = '5px';
        div.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        div.style.fontFamily = 'Arial, sans-serif';

        // Content
        div.innerHTML = `
      <strong>PhishEye Alert</strong><br>
      This site is marked as: <b>${request.status}</b><br>
      <button id="phisheye-close" style="margin-top:10px; padding:5px 10px; cursor:pointer;">Close</button>
    `;

        document.body.appendChild(div);

        // Close button logic
        document.getElementById('phisheye-close').addEventListener('click', function () {
            div.remove();
        });

        // Auto-remove safe notifications after 3s
        if (request.status === 'Safe') {
            setTimeout(() => { if (div) div.remove(); }, 3000);
        }
    }
});
