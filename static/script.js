/* ═══════════════════════════════════════════════════════════
   IT Infrastructure Procurement Portal — Frontend Logic
   ═══════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("procurementForm");
  const deptSelect = document.getElementById("department");
  const otherDeptGroup = document.getElementById("otherDeptGroup");
  const otherDeptName = document.getElementById("otherDeptName");
  const itemCategorySelect = document.getElementById("itemCategory");
  const laptopSection = document.getElementById("laptopSection");
  const specDisplay = document.getElementById("specDisplay");
  const laptopSpecsInput = document.getElementById("laptop_specs");
  const resetBtn = document.getElementById("resetBtn");
  const fillSampleBtn = document.getElementById("fillSampleBtn");
  const isDemoInput = document.getElementById("is_demo");
  const submitBtn = document.getElementById("submitBtn");
  const submitInfo = document.getElementById("submitInfo");

  const laptopSpecs = {
    high: {
      title: "Media / IT / Data Science — High Performance Configuration",
      specs: [
        { label: "Processor", value: "Intel 12th or 13th Gen H-series (i5-12xxxH or i7), or AMD Ryzen equivalent" },
        { label: "Graphics", value: "NVIDIA RTX 3050 with 4–6 GB VRAM, or RTX 4050 if possible" },
        { label: "RAM", value: "16 GB DDR4 or DDR5, dual channel" },
        { label: "Storage", value: "Minimum 512 GB NVMe SSD" }
      ]
    },
    accounts: {
      title: "Accounts / Finance / Training Academy — Standard Business Configuration",
      specs: [
        { label: "Processor", value: "Intel Core i5, 13th or 14th Gen" },
        { label: "RAM", value: "16 GB" },
        { label: "Storage", value: "512 GB NVMe SSD" }
      ]
    },
    basic: {
      title: "Translation / HR / Admin — Standard Configuration",
      specs: [
        { label: "Processor", value: "Intel Core i5, 13th Gen or newer, U-series or H-series" },
        { label: "RAM", value: "8 GB" },
        { label: "Storage", value: "512 GB NVMe SSD" }
      ]
    },
    other: {
      title: "Other Department",
      specs: []
    }
  };

  function deptToSpecKey(dept) {
    if (["Media", "IT", "Data Science"].includes(dept)) return "high";
    if (["Accounts", "Finance", "Accounts / Finance", "Training Academy"].includes(dept)) return "accounts";
    if (["Translation", "HR", "Admin"].includes(dept)) return "basic";
    return "other";
  }

  function renderSpec(key) {
    if (!key) {
      if (specDisplay) {
        specDisplay.innerHTML = `
          <div class="info-box blue" style="margin-bottom: 1rem;">
            👉 <strong>Please select your Department in Section 1</strong> to automatically load and highlight your department's standard laptop specification.
          </div>
          <div style="background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 8px; padding: 1.25rem; font-size: 0.88rem;">
            <strong style="color: #1e3a8a; font-size: 0.95rem; display: block; margin-bottom: 0.75rem;">📋 Standard Department Configurations Matrix:</strong>
            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              <div style="padding: 0.6rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #0f172a;">• Media / IT / Data Science (High Performance):</strong><br>
                <span style="color: #475569;">Processor: Intel 12th/13th Gen H-series (or Ryzen) | GPU: NVIDIA RTX 3050 / 4050 | RAM: 16 GB | Storage: 512 GB SSD</span>
              </div>
              <div style="padding: 0.6rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #0f172a;">• Accounts / Finance / Training Academy (Standard Business):</strong><br>
                <span style="color: #475569;">Processor: Intel Core i5, 13th or 14th Gen | RAM: 16 GB | Storage: 512 GB SSD</span>
              </div>
              <div style="padding: 0.6rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #0f172a;">• Translation / HR / Admin (Standard Office):</strong><br>
                <span style="color: #475569;">Processor: Intel Core i5, 13th Gen or newer (U/H series) | RAM: 8 GB | Storage: 512 GB SSD</span>
              </div>
              <div style="padding: 0.6rem; background: #fff; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #0f172a;">• Executive Office / Other Departments:</strong><br>
                <span style="color: #475569;">No standard configuration listed. IT Infrastructure will review the requirement directly.</span>
              </div>
            </div>
          </div>`;
      }
      if (laptopSpecsInput) laptopSpecsInput.value = "";
      return;
    }

    const data = laptopSpecs[key];
    if (key === "other") {
      if (specDisplay) {
        specDisplay.innerHTML = `
          <div class="info-box yellow">
            <strong>ℹ️ No standard configuration listed</strong><br>
            No standard configuration is currently listed for this department. IT Infrastructure will review the requirement and advise on the suitable configuration.
          </div>`;
      }
      if (laptopSpecsInput) laptopSpecsInput.value = "IT Infrastructure Custom Review Required";
      return;
    }

    let specTextList = [];
    let html = `<div class="spec-card"><h4>💻 ${data.title}</h4>`;
    data.specs.forEach((s) => {
      html += `<div class="spec-line"><span class="spec-label">${s.label}:</span><span class="spec-value">${s.value}</span></div>`;
      specTextList.push(`${s.label}: ${s.value}`);
    });
    html += `</div>`;
    if (specDisplay) specDisplay.innerHTML = html;
    if (laptopSpecsInput) laptopSpecsInput.value = data.title + " | " + specTextList.join(" | ");
  }

  // Section 3 Visibility: Show ONLY when Laptop / desktop is selected
  function updateLaptopSectionVisibility() {
    if (!itemCategorySelect || !laptopSection) return;
    const cat = (itemCategorySelect.value || "").trim().toLowerCase();
    const isLaptop = cat.includes("laptop");

    if (isLaptop) {
      laptopSection.style.display = "block";
      if (deptSelect && deptSelect.value) {
        renderSpec(deptToSpecKey(deptSelect.value));
      } else {
        renderSpec("");
      }
    } else {
      laptopSection.style.display = "none";
      if (laptopSpecsInput) laptopSpecsInput.value = "";
    }
  }

  if (itemCategorySelect) {
    itemCategorySelect.addEventListener("change", updateLaptopSectionVisibility);
  }

  // Handle department changes
  if (deptSelect) {
    deptSelect.addEventListener("change", () => {
      const isOther = deptSelect.value === "Other department";
      if (otherDeptGroup) {
        if (isOther) {
          otherDeptGroup.classList.add("visible");
          if (otherDeptName) otherDeptName.setAttribute("required", "true");
        } else {
          otherDeptGroup.classList.remove("visible");
          if (otherDeptName) otherDeptName.removeAttribute("required");
        }
      }

      updateLaptopSectionVisibility();
    });
  }

  // Initial visibility check (starts hidden unless Laptop selected)
  updateLaptopSectionVisibility();

  // Pre-fill today's date if empty
  const today = new Date().toISOString().split("T")[0];
  const dateOfRequest = document.getElementById("dateOfRequest");
  if (dateOfRequest && !dateOfRequest.value) {
    dateOfRequest.value = today;
  }

  // Sample Demo Data Filler
  if (fillSampleBtn) {
    fillSampleBtn.addEventListener("click", () => {
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
      };

      setVal("ticketNumber", "INC-DEMO-0084");
      setVal("dateOfRequest", today);
      setVal("requesterName", "Sample Requester");
      setVal("officialEmail", "requester@company.com");
      if (deptSelect) {
        deptSelect.value = "Data Science";
        deptSelect.dispatchEvent(new Event("change"));
      }
      setVal("hodManager", "Sample Reporting Manager");
      setVal("deliveryAddress", "Building A, Floor 2, Workstation #24");
      setVal("requestType", "New purchase");
      if (itemCategorySelect) {
        itemCategorySelect.value = "Laptop / desktop";
        updateLaptopSectionVisibility();
      }
      setVal("itemRequested", "Standard Data Science Laptop");
      setVal("quantity", "1");

      const reqDate = new Date();
      reqDate.setDate(reqDate.getDate() + 7);
      setVal("dateRequired", reqDate.toISOString().split("T")[0]);
      setVal("purpose", "Sample business justification demonstrating standard request form flow.");

      const d1 = document.getElementById("declaration1");
      if (d1) d1.checked = true;
      const d2 = document.getElementById("declaration2");
      if (d2) d2.checked = true;

      if (isDemoInput) isDemoInput.value = "1";
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "📨 Submit Request";
      }
      if (submitInfo) {
        submitInfo.textContent = "Sample test data loaded. Click Submit to record the requisition.";
        submitInfo.style.color = "#15803d";
        submitInfo.style.fontWeight = "600";
      }
    });
  }

  // Clear / Reset handler
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (isDemoInput) isDemoInput.value = "0";
        if (otherDeptGroup) otherDeptGroup.classList.remove("visible");
        if (dateOfRequest) dateOfRequest.value = today;
        updateLaptopSectionVisibility();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "📨 Submit Request";
        }
        if (submitInfo) {
          submitInfo.textContent = "Submitting records your requisition directly into the IT Procurement log.";
          submitInfo.style.color = "";
          submitInfo.style.fontWeight = "";
        }
      }, 50);
    });
  }
});
