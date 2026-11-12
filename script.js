/**
 * ═══════════════════════════════════════════════════════════════
 * IT Infrastructure Procurement Portal — Production Logic
 * Modern ES6+ · XSS-Safe · DRY Architecture
 * ═══════════════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  // ── DOM Helpers ──
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const getVal = (id) => $(id)?.value?.trim() || '';
  const toggle = (el, show) => el?.classList.toggle('visible', Boolean(show));

  // ── XSS Sanitizer ──
  const escapeHtml = (str) =>
    String(str ?? '').replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m]));

  // ── Single Source of Truth: Department Laptop Specs Matrix ──
  const LAPTOP_SPECS = {
    high: {
      depts: ['Media', 'IT', 'Data Science'],
      title: 'Media / IT / Data Science (High Performance)',
      specs: [
        { label: 'Processor', value: 'Intel 12th/13th Gen H-series (or Ryzen equivalent)' },
        { label: 'Graphics', value: 'NVIDIA RTX 3050 (4–6 GB) or RTX 4050' },
        { label: 'RAM', value: '16 GB DDR4/DDR5 dual-channel' },
        { label: 'Storage', value: 'Minimum 512 GB NVMe SSD' },
      ],
    },
    accounts: {
      depts: ['Accounts', 'Finance', 'Accounts / Finance', 'Training Academy'],
      title: 'Accounts / Finance / Training Academy (Standard Business)',
      specs: [
        { label: 'Processor', value: 'Intel Core i5, 13th or 14th Gen' },
        { label: 'RAM', value: '16 GB' },
        { label: 'Storage', value: '512 GB NVMe SSD' },
      ],
    },
    basic: {
      depts: ['Translation', 'HR', 'Admin'],
      title: 'Translation / HR / Admin (Standard Office)',
      specs: [
        { label: 'Processor', value: 'Intel Core i5, 13th Gen or newer (U/H series)' },
        { label: 'RAM', value: '8 GB' },
        { label: 'Storage', value: '512 GB NVMe SSD' },
      ],
    },
  };

  const getSpecKeyForDept = (dept) => {
    for (const [key, group] of Object.entries(LAPTOP_SPECS)) {
      if (group.depts.some((d) => dept.includes(d))) return key;
    }
    return 'other';
  };

  const getSpecSummaryText = (key) => {
    const config = LAPTOP_SPECS[key];
    if (!config) return 'Custom / Non-standard review required by IT Infrastructure';
    return `${config.title} [${config.specs.map((s) => `${s.label}: ${s.value}`).join(' | ')}]`;
  };

  // ── State Variables ──
  let itemCount = 1;
  let isSampleData = false;

  // ── Spec Matrix Renderer ──
  const renderSpec = (dept) => {
    const specDisplay = $('specDisplay');
    if (!specDisplay) return;

    if (!dept) {
      specDisplay.innerHTML = `
        <div class="info-box blue" style="margin-bottom: 0.75rem;">
          👉 <strong>Please select your Department in Section 1</strong> to automatically load and highlight your department's standard laptop specification.
        </div>
        <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 1rem; font-size: 0.85rem;">
          <strong style="color: #1e3a8a; display: block; margin-bottom: 0.5rem;">📋 Standard Department Configurations Matrix:</strong>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${Object.values(LAPTOP_SPECS).map((grp) => `
              <div style="padding: 0.5rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #0f172a;">• ${escapeHtml(grp.title)}:</strong><br>
                <span style="color: #475569;">${grp.specs.map((s) => `${s.label}: ${s.value}`).join(' | ')}</span>
              </div>
            `).join('')}
            <div style="padding: 0.5rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
              <strong style="color: #0f172a;">• Executive Office / Other Departments:</strong><br>
              <span style="color: #475569;">No standard configuration listed. IT Infrastructure reviews directly.</span>
            </div>
          </div>
        </div>`;
      return;
    }

    const key = getSpecKeyForDept(dept);
    const data = LAPTOP_SPECS[key];

    if (!data) {
      specDisplay.innerHTML = `
        <div class="info-box yellow">
          <strong>ℹ️ No standard configuration listed</strong><br>
          No preset configuration is listed for this department. IT Infrastructure will review your workload requirements directly.
        </div>`;
      return;
    }

    specDisplay.innerHTML = `
      <div class="spec-card">
        <h4>💻 ${escapeHtml(data.title)}</h4>
        ${data.specs.map((s) => `
          <div class="spec-line">
            <span class="spec-label">${escapeHtml(s.label)}:</span>
            <span class="spec-value">${escapeHtml(s.value)}</span>
          </div>
        `).join('')}
      </div>`;
  };

  // ── Conditional Visibility Updaters ──
  const updateVisibility = () => {
    // 1. Department "Other" field
    const isOtherDept = getVal('department') === 'Other department';
    toggle($('otherDeptGroup'), isOtherDept);
    const otherDeptName = $('otherDeptName');
    if (otherDeptName) otherDeptName.required = isOtherDept;

    // 2. Section 3: Laptop/desktop display (Shown ONLY when category includes laptop)
    const isLaptop = getVal('itemCategory').toLowerCase().includes('laptop');
    const laptopSection = $('laptopSection');
    if (laptopSection) {
      toggle(laptopSection, isLaptop);
      laptopSection.style.display = isLaptop ? 'block' : 'none';
    }
    renderSpec(getVal('department'));

    // 3. Section 4: Existing Equipment (for Replacement, Upgrade, Repair, Licence renewal)
    const reqType = getVal('requestType');
    const showExisting = ['Replacement', 'Upgrade', 'Repair / spare part', 'Licence / subscription renewal'].includes(reqType);
    toggle($('existingEquipSection'), showExisting);

    // 4. Laptop Accessories
    toggle($('additionalAccessoriesFields'), getVal('additionalAccessories') === 'Yes');

    // 5. Config Confirmation Messages
    const confVal = getVal('configConfirmation');
    toggle($('configNoFields'), confVal === 'No — request a different configuration');
    toggle($('configUnsureMsg'), confVal === 'Unsure / no standard is listed');
    toggle($('configYesMsg'), confVal === 'Yes — proceed with the standard configuration');

    updateProgress();
  };

  // ── Progress Bar Calculation ──
  const updateProgress = () => {
    const requiredInputs = $$('#procurementForm [required]');
    let filled = 0;
    requiredInputs.forEach((el) => {
      if (el.offsetParent === null) {
        filled++; // Count hidden required fields as satisfied
        return;
      }
      if (el.type === 'checkbox' ? el.checked : el.value.trim() !== '') {
        filled++;
      }
    });
    const pct = requiredInputs.length ? Math.round((filled / requiredInputs.length) * 100) : 0;
    const bar = document.querySelector('.progress-bar-fill');
    if (bar) bar.style.width = `${pct}%`;
  };

  // ── Dynamic Item Adder / Remover ──
  const attachItemListeners = (container) => {
    $('addItemBtn')?.addEventListener('click', () => {
      itemCount++;
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <div class="item-row-header">
          <h4>📦 Additional Item #${itemCount}</h4>
          <button type="button" class="btn btn-danger btn-sm remove-item-btn">✕ Remove</button>
        </div>
        <div class="field-grid">
          <div class="field-group full-width">
            <label>Item or service requested <span class="req">*</span></label>
            <input type="text" class="add-item-name" name="additionalItem_${itemCount}" required>
          </div>
          <div class="field-group">
            <label>Quantity <span class="req">*</span></label>
            <input type="number" class="add-item-qty" name="additionalQty_${itemCount}" min="1" value="1" required>
          </div>
          <div class="field-group">
            <label>Date required <span class="req">*</span></label>
            <input type="date" class="add-item-date" name="additionalDate_${itemCount}" required>
          </div>
          <div class="field-group full-width">
            <label>Purpose / work to be performed <span class="req">*</span></label>
            <textarea class="add-item-purpose" name="additionalPurpose_${itemCount}" rows="2" required></textarea>
          </div>
          <div class="field-group">
            <label>Preferred brand or model</label>
            <input type="text" class="add-item-brand" name="additionalBrand_${itemCount}">
          </div>
        </div>`;
      container.appendChild(row);

      row.querySelector('.remove-item-btn').addEventListener('click', () => {
        row.remove();
        $$('#itemsContainer .item-row').forEach((r, idx) => {
          const title = r.querySelector('h4');
          if (title) title.textContent = `📦 Additional Item #${idx + 2}`;
        });
        updateProgress();
      });
      updateProgress();
    });
  };

  // ── File Upload List Handlers ──
  const setupFileUploads = () => {
    $$('.file-upload-area').forEach((area) => {
      const input = area.querySelector('input[type="file"]');
      const listContainer = area.closest('.field-group')?.querySelector('.file-list');
      if (!input || !listContainer) return;

      input.addEventListener('change', () => {
        Array.from(input.files).forEach((file) => {
          const item = document.createElement('div');
          item.className = 'file-item';
          item.innerHTML = `
            <span>📎 ${escapeHtml(file.name)} (${(file.size / 1024).toFixed(1)} KB)</span>
            <button type="button" class="remove-file" title="Remove">✕</button>`;
          item.querySelector('.remove-file').addEventListener('click', () => item.remove());
          listContainer.appendChild(item);
        });
      });
    });
  };

  // ── Toast Notifications ──
  const showToast = (message, type = 'success') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '⚠️', warning: 'ℹ️' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  };

  // ── Clipboard Copy ──
  const copyToClipboard = (text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast('📋 Formatted email body copied to clipboard!', 'success'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(ok ? '📋 Formatted email copied!' : 'Please press Ctrl+C to copy.', ok ? 'success' : 'warning');
  };

  // ── Populate Output Modal Hub (XSS-Safe) ──
  const populateModalHub = () => {
    const rawDept = getVal('department') || 'IT';
    const dept = rawDept === 'Other department' && getVal('otherDeptName') ? `Other (${getVal('otherDeptName')})` : rawDept;
    const ticket = getVal('ticketNumber') || 'INC-00012345';
    const reqDate = getVal('dateOfRequest') || new Date().toISOString().split('T')[0];
    const name = getVal('requesterName') || 'Requester Name';
    const email = getVal('officialEmail') || 'employee@company.com';
    const hod = getVal('hodManager') || 'Reporting Manager';
    const loc = getVal('deliveryAddress') || 'Office Location';
    const project = getVal('projectUnit') || 'N/A';
    const contact = getVal('contactNumber') || 'N/A';

    const reqType = getVal('requestType') || 'New purchase';
    const cat = getVal('itemCategory') || 'General Equipment';
    const item = getVal('itemRequested') || 'Item Requested';
    const qty = getVal('quantity') || '1';
    const users = getVal('intendedUsers') || name;
    const purpose = getVal('purpose') || 'Operational duties';
    const dateReq = getVal('dateRequired') || reqDate;
    const brand = getVal('preferredBrand') || 'Any standard brand';
    const addlNotes = getVal('additionalRequirements');

    const isLaptop = cat.toLowerCase().includes('laptop');
    const laptopSpecStr = isLaptop ? getSpecSummaryText(getSpecKeyForDept(rawDept)) : '';

    // Sample Data Visual Mode
    const docArea = $('docPreviewArea');
    const sampleBanner = $('sampleNoticeBanner');
    const downloadDocBtn = $('downloadDocBtn');

    if (docArea) docArea.classList.toggle('is-sample', isSampleData);
    if (sampleBanner) sampleBanner.style.display = isSampleData ? 'flex' : 'none';
    if (downloadDocBtn) {
      downloadDocBtn.title = isSampleData ? 'Sample data is view-only.' : 'Print or Save Requisition PDF';
      downloadDocBtn.style.opacity = isSampleData ? '0.75' : '1';
    }

    // ── 1. Populate Requisition Document Elements ──
    $('docGeneratedDate').textContent = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    $('docTicketNum').textContent = ticket;
    $('docReqDate').textContent = reqDate;
    $('docReqName').textContent = name;
    $('docReqEmail').textContent = email;
    $('docDept').textContent = dept;
    $('docProject').textContent = project;
    $('docHod').textContent = hod;
    $('docContact').textContent = contact;
    $('docLoc').textContent = loc;

    $('docReqType').textContent = reqType;
    $('docCategory').textContent = cat;
    $('docDateReq').textContent = dateReq;
    $('docBrand').textContent = brand;
    $('docIntendedUsers').textContent = users;

    $('docItemAndPurpose').innerHTML = `
      <strong>${escapeHtml(item)}</strong> (Quantity: ${escapeHtml(qty)})<br>
      <span style="color: #475569;">Purpose / Work:</span> ${escapeHtml(purpose)}
      ${addlNotes ? `<br><span style="color: #475569;">Additional Notes:</span> ${escapeHtml(addlNotes)}` : ''}
    `;

    // Additional Items Summary
    const addItems = $$('#itemsContainer .item-row').map((r, i) => {
      const itmName = r.querySelector('.add-item-name')?.value?.trim();
      const itmQty = r.querySelector('.add-item-qty')?.value?.trim() || '1';
      const itmPurpose = r.querySelector('.add-item-purpose')?.value?.trim() || '';
      return itmName ? `• Additional Item #${i + 2}: ${escapeHtml(itmName)} (Qty: ${escapeHtml(itmQty)}) — ${escapeHtml(itmPurpose)}` : null;
    }).filter(Boolean);

    const docAddItemsBox = $('docAdditionalItemsBox');
    if (docAddItemsBox) {
      docAddItemsBox.style.display = addItems.length ? 'block' : 'none';
      docAddItemsBox.innerHTML = `<strong>Additional Items Requested:</strong><br>${addItems.join('<br>')}`;
    }

    // Laptop Specs in Document
    const docLaptopBox = $('docLaptopBox');
    if (docLaptopBox) {
      docLaptopBox.style.display = isLaptop ? 'block' : 'none';
      if (isLaptop) {
        let content = `<strong>Department Standard Specification:</strong><br>${escapeHtml(laptopSpecStr)}<br><br>`;
        content += `<strong>Standard Accessories Included:</strong> Carrying bag, Mouse, Headphones<br>`;
        if (getVal('additionalAccessories') === 'Yes') {
          content += `<strong>Additional Accessories:</strong> ${escapeHtml(getVal('accessoryDetail'))} (Justification: ${escapeHtml(getVal('accessoryJustification'))})<br>`;
        }
        content += `<strong>Configuration Confirmation:</strong> ${escapeHtml(getVal('configConfirmation'))}`;
        if (getVal('configConfirmation').includes('No')) {
          content += `
            <div style="margin-top: 0.35rem; padding: 0.5rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px;">
              <strong>Requested Non-Standard Config:</strong> ${escapeHtml(getVal('requestedConfig'))}<br>
              <strong>Difference:</strong> ${escapeHtml(getVal('configDifference'))}<br>
              <strong>Business Justification:</strong> ${escapeHtml(getVal('configJustification'))}
            </div>`;
        }
        docLaptopBox.innerHTML = content;
      }
    }

    // Existing Equipment in Document
    const docExistingBox = $('docExistingBox');
    const hasExisting = $('existingEquipSection')?.classList.contains('visible');
    if (docExistingBox) {
      docExistingBox.style.display = hasExisting && (getVal('existingItem') || getVal('assetId')) ? 'block' : 'none';
      if (hasExisting) {
        docExistingBox.innerHTML = `
          <strong>Existing Equipment Details:</strong><br>
          Item: ${escapeHtml(getVal('existingItem') || 'N/A')} | Asset ID: ${escapeHtml(getVal('assetId') || 'N/A')} | Current User: ${escapeHtml(getVal('currentUser') || 'N/A')}<br>
          <strong>Reason / Issue:</strong> ${escapeHtml(getVal('issueReason') || 'N/A')}
        `;
      }
    }

    $('docSigRequester').textContent = getVal('declarationName') || name;
    $('docSigDate').textContent = getVal('declarationDate') || reqDate;

    // ── 2. Populate Multi-Party Automated Email ──
    const itEmail = 'it-procurement@company.internal';
    const cc = `${email}, ${hod.toLowerCase().replace(/[^a-z0-9]/g, '.')}@company.internal`;
    const subj = `[Procurement Request] ${ticket} - ${cat} (${dept})`;

    $('emailTo').textContent = itEmail;
    $('emailCc').textContent = cc;
    $('emailSubject').textContent = subj;

    let body = `Dear IT Procurement Team,\n\n`;
    body += `A new IT Infrastructure Procurement Request has been submitted:\n\n`;
    body += `1. REQUESTER INFORMATION\n--------------------------------------------------\n`;
    body += `Ticket Number   : ${ticket}\nRequest Date    : ${reqDate}\nRequester Name  : ${name}\n`;
    body += `Official Email  : ${email}\nDepartment      : ${dept}\nReporting HOD   : ${hod}\nDelivery Address: ${loc}\n\n`;
    body += `2. PROCUREMENT SPECIFICATIONS\n--------------------------------------------------\n`;
    body += `Request Type    : ${reqType}\nCategory        : ${cat}\nItem Requested  : ${item} (Qty: ${qty})\n`;
    body += `Date Required   : ${dateReq}\nPurpose         : ${purpose}\n`;

    if (isLaptop) {
      body += `\n3. LAPTOP CONFIGURATION\n--------------------------------------------------\n`;
      body += `Standard Spec   : ${laptopSpecStr}\nIncluded Kit    : Carrying bag, Mouse, Headphones\n`;
      body += `Confirmation    : ${getVal('configConfirmation')}\n`;
    }
    body += `\nRegards,\n${name}\n${dept}`;

    $('emailBodyContent').innerHTML = `<div style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(body)}</div>`;
    $('emailMailtoLink').href = `mailto:${encodeURIComponent(itEmail)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;

    $('copyEmailBtn').onclick = () => copyToClipboard(body);
  };

  // ── Form Reset Handler ──
  const performReset = () => {
    const form = $('procurementForm');
    if (!form) return;
    form.reset();
    isSampleData = false;

    $$('.conditional').forEach((el) => el.classList.remove('visible'));
    const laptopSec = $('laptopSection');
    if (laptopSec) {
      laptopSec.classList.remove('visible');
      laptopSec.style.display = 'none';
    }

    $('itemsContainer').innerHTML = '';
    itemCount = 1;
    $$('.file-list').forEach((l) => (l.innerHTML = ''));
    $$('.invalid').forEach((el) => el.classList.remove('invalid'));

    const today = new Date().toISOString().split('T')[0];
    if ($('dateOfRequest')) $('dateOfRequest').value = today;
    if ($('declarationDate')) $('declarationDate').value = today;

    renderSpec('');
    updateProgress();
    showToast('Form has been reset to default.', 'success');
  };

  // ── Execution / Print Flow ──
  const executePrint = () => {
    populateModalHub();
    if (isSampleData) {
      showToast('⚠️ Sample demo data cannot be printed. Please enter actual details.', 'warning');
      return;
    }
    const printContainer = $('printContainer');
    const docPreview = $('docPreviewArea');
    if (printContainer && docPreview) {
      printContainer.innerHTML = '';
      printContainer.appendChild(docPreview.cloneNode(true));
      window.print();
    }
  };

  // ── Validation & Submission ──
  const handleSubmit = (e) => {
    e?.preventDefault();
    $$('.invalid').forEach((el) => el.classList.remove('invalid'));

    const visibleRequired = $$('#procurementForm [required]').filter((el) => el.offsetParent !== null);
    let firstInvalid = null;

    for (const el of visibleRequired) {
      let valid = true;
      if (el.type === 'checkbox') valid = el.checked;
      else if (el.type === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
      else valid = el.value.trim() !== '';

      if (!valid) {
        el.classList.add('invalid');
        if (!firstInvalid) firstInvalid = el;
      }
    }

    if (firstInvalid) {
      if (firstInvalid.scrollIntoView) {
        firstInvalid.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
      firstInvalid.focus();
      showToast('Please fill all mandatory fields marked with *.', 'error');
      return false;
    }

    populateModalHub();
    $('demoModal')?.classList.add('active');
    showToast('Requisition compiled! Review PDF & Email output.', 'success');
    return false;
  };

  // ── Sample Demo Data Filler ──
  const loadSampleData = () => {
    isSampleData = true;
    const today = new Date().toISOString().split('T')[0];
    const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const fillMap = {
      ticketNumber: 'INC-DEMO-9999',
      dateOfRequest: today,
      requesterName: 'Elena Rostova (Demo)',
      officialEmail: 'elena.rostova@company.com',
      department: 'Data Science',
      deliveryAddress: 'Building 4, Floor 3, Analytics Pod 12',
      hodManager: 'Dr. David K. (Demo)',
      contactNumber: '+91 98765 43210',
      requestType: 'New purchase',
      itemCategory: 'Laptop / desktop',
      itemRequested: 'MacBook Pro 16 M3 Max',
      quantity: '1',
      intendedUsers: 'Data Science NLP Team',
      purpose: 'Training localized LLM reasoning agents and CUDA-accelerated model inference.',
      dateRequired: future,
      preferredBrand: 'Apple / Dell Precision',
      additionalAccessories: 'No',
      configConfirmation: 'Yes — proceed with the standard configuration',
      declarationName: 'Elena Rostova (Demo)',
      declarationDate: today,
    };

    Object.entries(fillMap).forEach(([id, val]) => {
      const el = $(id);
      if (el) el.value = val;
    });

    if ($('declaration1')) $('declaration1').checked = true;
    if ($('declaration2')) $('declaration2').checked = true;

    updateVisibility();
    showToast('Sample demo data loaded. Note: Printing is disabled for demo data.', 'warning');
  };

  // ── Init Event Listeners ──
  const init = () => {
    const form = $('procurementForm');
    if (!form) return;

    // Change & Input Delegation for Visibility & Progress
    form.addEventListener('change', (e) => {
      isSampleData = false;
      updateVisibility();
    });
    form.addEventListener('input', () => {
      isSampleData = false;
      updateProgress();
    });
    form.addEventListener('submit', handleSubmit);
    $('submitBtn')?.addEventListener('click', handleSubmit);

    // Dynamic Items
    const itemsContainer = $('itemsContainer');
    if (itemsContainer) attachItemListeners(itemsContainer);

    // File Uploads
    setupFileUploads();

    // Reset Buttons (Top & Bottom)
    $('topResetBtn')?.addEventListener('click', performReset);
    $('resetBtn')?.addEventListener('click', performReset);

    // Sample Data & Direct Preview Buttons
    $('fillSampleBtn')?.addEventListener('click', loadSampleData);
    $('openDemoDirectBtn')?.addEventListener('click', () => {
      populateModalHub();
      $('demoModal')?.classList.add('active');
    });

    // Print Buttons
    $('printBtn')?.addEventListener('click', executePrint);
    $('downloadDocBtn')?.addEventListener('click', executePrint);

    // Modal Tabs Switching
    $$('.modal-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.modal-tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        const targetTabId = btn.getAttribute('data-tab');
        $$('.tab-pane').forEach((p) => p.classList.toggle('active', p.id === targetTabId));
      });
    });

    // Modal Close Handlers
    const closeModal = () => $('demoModal')?.classList.remove('active');
    $('modalCloseBtn')?.addEventListener('click', closeModal);
    $('modalCloseFooterBtn')?.addEventListener('click', closeModal);
    $('demoModal')?.addEventListener('click', (e) => {
      if (e.target === $('demoModal')) closeModal();
    });

    // Default dates initialization
    const today = new Date().toISOString().split('T')[0];
    if ($('dateOfRequest') && !$('dateOfRequest').value) $('dateOfRequest').value = today;
    if ($('declarationDate') && !$('declarationDate').value) $('declarationDate').value = today;

    // Initial state setup
    updateVisibility();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
