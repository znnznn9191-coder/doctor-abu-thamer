class ResearchApp {
  constructor() {
    this.state = {
      researches: [],
      selectedResearchId: null,
      sections: [],
      sources: [],
      history: []
    };

    this.sectionTypes = [
      { key: 'overview', title: 'نظرة عامة' },
      { key: 'problem', title: 'مشكلة البحث' },
      { key: 'questions', title: 'أسئلة البحث' },
      { key: 'objectives', title: 'الأهداف' },
      { key: 'literature', title: 'الدراسات السابقة' },
      { key: 'methodology', title: 'المنهجية' },
      { key: 'sources', title: 'المصادر والمراجع' },
      { key: 'final_review', title: 'المراجعة النهائية' }
    ];

    this.form = document.getElementById('research-form');
    this.researchList = document.getElementById('research-list');
    this.workspaceTitle = document.getElementById('workspace-title');
    this.readinessStatus = document.getElementById('readiness-status');
    this.savedSectionsList = document.getElementById('saved-sections-list');
    this.savedSectionCount = document.getElementById('saved-section-count');
    this.savedManuscript = document.getElementById('saved-manuscript');
    this.sourceForm = document.getElementById('source-form');
    this.sourceList = document.getElementById('source-list');
    this.historyList = document.getElementById('history-list');
    this.reviewButton = document.getElementById('run-review-btn');
    this.newResearchButton = document.getElementById('new-research-btn');
    this.myResearchesButton = document.getElementById('my-researches-btn');
  }

  async init() {
    this.bindEvents();
    await this.loadResearches();
    const lastId = localStorage.getItem('doctor-abu-thamer-last-research');

    if (lastId && this.state.researches.some((item) => item.id === lastId)) {
      this.selectResearch(lastId);
    } else if (this.state.researches.length > 0) {
      this.selectResearch(this.state.researches[0].id);
    }
  }

  bindEvents() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveResearch();
    });

    this.newResearchButton.addEventListener('click', () => {
      this.resetForm();
    });

    if (this.myResearchesButton) {
      this.myResearchesButton.addEventListener('click', () => {
        this.researchList.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    this.reviewButton.addEventListener('click', () => this.runReview());

    this.sourceForm.addEventListener('submit', (event) => {
      event.preventDefault();
      this.saveSource();
    });

    this.sectionTypes.forEach(({ key, title }) => {
      const textarea = document.getElementById(`section-${key}`);
      const button = document.getElementById(`save-section-${key}`);
      if (textarea && button) {
        button.addEventListener('click', () => this.saveSection(key, textarea.value, title));
      }
    });

    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach((item) => item.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
        button.classList.add('active');
        const target = document.getElementById(`panel-${button.dataset.tab}`);
        if (target) target.classList.add('active');
      });
    });
  }

  async loadResearches() {
    const response = await api.listResearches();
    this.state.researches = response.data || [];
    this.renderResearchList();
  }

  renderResearchList() {
    this.researchList.innerHTML = '';

    if (!this.state.researches.length) {
      this.researchList.innerHTML = '<div class="empty-state">لا توجد أبحاث محفوظة بعد.</div>';
      return;
    }

    this.state.researches.forEach((research) => {
      const card = document.createElement('div');
      card.className = `research-card ${this.state.selectedResearchId === research.id ? 'active' : ''}`;
      const updatedAt = research.updated_at ? new Date(research.updated_at).toLocaleString('ar-SA') : 'غير محدد';
      card.innerHTML = `
        <div class="meta">
          <span class="small-badge">${this.escapeHtml(this.statusLabel(research.status))}</span>
        </div>
        <p class="card-title">${this.escapeHtml(research.title)}</p>
        <div>${this.escapeHtml(research.field || 'غير محدد')}</div>
        <div>آخر تحديث: ${updatedAt}</div>
        <div class="card-actions">
          <button class="open-btn" data-open-id="${research.id}">فتح</button>
          <button class="delete-btn" data-delete-id="${research.id}">حذف</button>
        </div>
      `;

      card.querySelector('[data-open-id]').addEventListener('click', () => this.selectResearch(research.id));
      card.querySelector('[data-delete-id]').addEventListener('click', () => this.deleteResearch(research.id));
      this.researchList.appendChild(card);
    });
  }

  statusLabel(status) {
    const labels = {
      draft: 'مسودة',
      ready_for_submission: 'جاهز للتسليم',
      blocked: 'يحتاج مصدر موثّق',
      needs_repair: 'يحتاج مراجعة إضافية',
      under_review: 'جاري المراجعة الأكاديمية'
    };
    return labels[status] || 'مسودة';
  }

  async selectResearch(id) {
    const response = await api.getResearchDetails(id);
    const details = response.data;
    const research = details.research;

    this.state.selectedResearchId = research.id;
    this.state.sections = details.sections || [];
    this.state.sources = details.sources || [];
    this.state.history = details.history || [];

    localStorage.setItem('doctor-abu-thamer-last-research', research.id);
    this.populateResearchForm(research);
    this.renderSectionEditors();
    this.renderSavedSections();
    this.renderSavedManuscript(research);
    this.renderReadinessStatus(research);
    this.renderSources();
    this.renderHistory();
    this.renderResearchList();
    this.workspaceTitle.textContent = research.title;
  }

  populateResearchForm(research) {
    this.form.title.value = research.title || '';
    this.form.field.value = research.field || '';
    this.form.research_type.value = research.research_type || 'بحث أكاديمي';
    this.form.level.value = research.level || 'دراسات عليا';
    this.form.notes.value = research.notes || '';
  }

  resetForm() {
    this.state.selectedResearchId = null;
    this.state.sections = [];
    this.state.sources = [];
    this.state.history = [];
    this.workspaceTitle.textContent = 'بحث جديد';
    this.form.reset();
    this.form.title.value = '';
    this.form.field.value = 'التربية والتعليم';
    this.form.research_type.value = 'بحث أكاديمي';
    this.form.level.value = 'دراسات عليا';
    this.form.notes.value = '';
    this.renderSectionEditors();
    this.renderSources();
    this.renderHistory();
    this.renderResearchList();
  }

  async saveResearch() {
    const payload = {
      title: this.form.title.value.trim(),
      field: this.form.field.value,
      research_type: this.form.research_type.value,
      level: this.form.level.value,
      notes: this.form.notes.value.trim(),
      status: 'draft'
    };

    if (!payload.title) {
      alert('يرجى إدخال عنوان البحث أولاً.');
      return;
    }

    let response;
    if (this.state.selectedResearchId) {
      response = await api.updateResearch(this.state.selectedResearchId, payload);
    } else {
      response = await api.createResearch(payload);
      this.state.selectedResearchId = response.data.id;
      localStorage.setItem('doctor-abu-thamer-last-research', this.state.selectedResearchId);
    }

    await this.loadResearches();
    await this.selectResearch(this.state.selectedResearchId || response.data.id);
    alert('تم حفظ البحث بنجاح.');
  }

  async deleteResearch(id) {
    if (!window.confirm('هل تريد حذف هذا البحث؟')) {
      return;
    }

    await api.deleteResearch(id);
    if (this.state.selectedResearchId === id) {
      this.state.selectedResearchId = null;
    }
    await this.loadResearches();
    if (this.state.researches.length > 0) {
      await this.selectResearch(this.state.researches[0].id);
    } else {
      this.resetForm();
    }
  }

  renderSectionEditors() {
    this.sectionTypes.forEach(({ key, title }) => {
      const textarea = document.getElementById(`section-${key}`);
      const section = this.state.sections.find((item) => item.section_type === key);
      if (textarea) {
        textarea.value = section ? (section.content || '') : this.defaultSectionContent(key, title);
      }
    });
  }

  renderSavedSections() {
    if (!this.savedSectionsList) return;
    this.savedSectionsList.replaceChildren();
    const sections = [...this.state.sections].sort((left, right) => Number(left.sort_order) - Number(right.sort_order));
    if (this.savedSectionCount) this.savedSectionCount.textContent = `${sections.length} قسم`;

    sections.forEach((section, index) => {
      const details = document.createElement('details');
      details.className = 'saved-section';
      details.open = index === 0;
      const summary = document.createElement('summary');
      summary.textContent = `${String(index + 1).padStart(2, '0')} · ${section.title}`;
      const content = document.createElement('div');
      content.className = 'saved-section-content';
      content.textContent = section.content || 'لا يوجد محتوى محفوظ لهذا القسم.';
      details.append(summary, content);
      this.savedSectionsList.appendChild(details);
    });
  }

  renderSavedManuscript(research) {
    if (!this.savedManuscript) return;
    this.savedManuscript.replaceChildren();
    const manuscript = research.professor_reviewed_draft || research.corrected_draft || research.researcher_draft || research.generated_draft;
    if (!manuscript) return;
    const heading = document.createElement('h2');
    heading.textContent = 'المخطوطة بعد المراجعة الأكاديمية';
    const body = document.createElement('pre');
    body.className = 'saved-manuscript-content';
    body.textContent = manuscript;
    this.savedManuscript.append(heading, body);
  }

  renderReadinessStatus(research) {
    if (!this.readinessStatus) return;
    const labels = {
      READY: 'جاهز للتسليم',
      NEEDS_REPAIR: 'يحتاج مراجعة إضافية',
      BLOCKED: 'يحتاج مصدر موثّق'
    };
    this.readinessStatus.textContent = labels[research.readiness_status] || this.statusLabel(research.status);
  }

  defaultSectionContent(key, title) {
    const defaults = {
      overview: 'اكتب نظرة عامة مختصرة عن البحث وأهدافه الأساسية.',
      problem: 'حدد مشكلة البحث، الأسباب المؤدية إليها، وأهم الأسئلة التي يهدف إلى الإجابة عنها.',
      questions: 'اكتب أسئلة البحث الرئيسة والفرعية بشكل منظم.',
      objectives: 'حدد الأهداف العامة والخاصة لهذا البحث.',
      literature: 'انقل ملخص الدراسات السابقة، أولوياتها، والفراغ البحثي الذي يهدف البحث إلى ملئه.',
      methodology: 'اكتب المنهجية المقترحة، أدوات جمع البيانات، ومراعاة المعايير الأكاديمية.',
      sources: 'سجل المراجع الرئيسية، المصادر الموثقة، وطبيعة التوثيق المطلوب.',
      final_review: 'اكتب المراجعة النهائية، تمييز ما تم التحقق منه، وما يحتاج إلى مراجعة إضافية.'
    };

    return defaults[key] || `اكتب محتوى ${title}`;
  }

  async saveSection(key, content, title) {
    if (!this.state.selectedResearchId) {
      alert('يرجى حفظ البحث أولاً قبل ملء الأقسام.');
      return;
    }

    const existing = this.state.sections.find((item) => item.section_type === key);

    const payload = {
      section_type: key,
      title,
      content,
      sort_order: this.sectionTypes.findIndex((item) => item.key === key) + 1
    };

    let response;
    if (existing) {
      response = await api.updateSection(existing.id, payload);
    } else {
      response = await api.createSection(this.state.selectedResearchId, payload);
    }

    await this.selectResearch(this.state.selectedResearchId);
    alert('تم حفظ القسم بنجاح.');
    return response;
  }

  renderSources() {
    this.sourceList.innerHTML = '';

    if (!this.state.sources.length) {
      this.sourceList.innerHTML = '<div class="empty-state">لا توجد مصادر مسجلة بعد.</div>';
      return;
    }

    this.state.sources.forEach((source) => {
      const item = document.createElement('div');
      item.className = 'source-item';
      const verificationLabel = source.verification_status === 'verified' ? 'مصدر متحقق' : 'بحاجة إلى تحقق';
      item.innerHTML = `
        <h4>${this.escapeHtml(source.title || 'مصدر غير مسمى')}</h4>
        <div class="source-meta">${this.escapeHtml(source.authors || 'مؤلف غير محدد')} • ${this.escapeHtml(source.year || 'سنة غير محددة')}</div>
        <div class="source-meta">${this.escapeHtml(source.journal_or_publisher || 'دورية أو ناشر غير محدد')} • ${verificationLabel}</div>
        <div>${this.escapeHtml((source.doi || source.url || source.notes || 'لا توجد ملاحظات إضافية.'))}</div>
        <div class="source-actions">
          <button class="open-btn" data-source-id="${source.id}">تعديل</button>
          <button class="delete-btn" data-source-delete-id="${source.id}">حذف</button>
        </div>
      `;

      item.querySelector('[data-source-id]').addEventListener('click', () => this.populateSourceForm(source));
      item.querySelector('[data-source-delete-id]').addEventListener('click', () => this.deleteSource(source.id));
      this.sourceList.appendChild(item);
    });
  }

  populateSourceForm(source) {
    this.sourceForm.dataset.editId = source.id || '';
    this.sourceForm.title.value = source.title || '';
    this.sourceForm.authors.value = source.authors || '';
    this.sourceForm.year.value = source.year || '';
    this.sourceForm.journal_or_publisher.value = source.journal_or_publisher || '';
    this.sourceForm.url.value = source.url || '';
    this.sourceForm.doi.value = source.doi || '';
    this.sourceForm.notes.value = source.notes || '';
  }

  async saveSource() {
    if (!this.state.selectedResearchId) {
      alert('يرجى حفظ البحث أولاً قبل إضافة مصادر.');
      return;
    }

    const payload = {
      title: this.sourceForm.title.value.trim(),
      authors: this.sourceForm.authors.value.trim(),
      year: this.sourceForm.year.value.trim(),
      journal_or_publisher: this.sourceForm.journal_or_publisher.value.trim(),
      url: this.sourceForm.url.value.trim(),
      doi: this.sourceForm.doi.value.trim(),
      notes: this.sourceForm.notes.value.trim(),
      source_type: 'مرجع أكاديمي'
    };

    if (!payload.title && !payload.url && !payload.doi && !payload.notes) {
      alert('يرجى إدخال عنوان المصدر أو رابط أو ملاحظات قبل الحفظ.');
      return;
    }

    if (this.sourceForm.dataset.editId) {
      await api.updateSource(this.sourceForm.dataset.editId, payload);
    } else {
      await api.createSource(this.state.selectedResearchId, payload);
    }

    this.sourceForm.reset();
    delete this.sourceForm.dataset.editId;
    await this.selectResearch(this.state.selectedResearchId);
    alert('تم حفظ المصدر بنجاح.');
  }

  async deleteSource(id) {
    if (!window.confirm('هل تريد حذف هذا المصدر؟')) {
      return;
    }

    await api.deleteSource(id);
    await this.selectResearch(this.state.selectedResearchId);
  }

  renderHistory() {
    this.historyList.innerHTML = '';

    if (!this.state.history.length) {
      this.historyList.innerHTML = '<li class="empty-state">لا يوجد سجل للنشاط بعد.</li>';
      return;
    }

    this.state.history.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'history-item';
      const createdAt = new Date(entry.created_at).toLocaleString('ar-SA');
      item.innerHTML = `<strong>${this.escapeHtml(entry.action || 'نشاط')}</strong><br>${this.escapeHtml(entry.details || '')}<br><small>${createdAt}</small>`;
      this.historyList.appendChild(item);
    });
  }

  async runReview() {
    if (!this.state.selectedResearchId) {
      alert('يرجى حفظ البحث أولاً قبل إعداد المراجعة.');
      return;
    }

    const response = await api.runReview(this.state.selectedResearchId);
    const review = response.data;
    const summary = review.summary || {};

    if (summary.source_status) {
      alert(summary.source_status);
    }

    await this.selectResearch(this.state.selectedResearchId);
    this.renderHistory();
    this.showReviewMessage(summary.status_label || summary.final_assessment || 'تمت المراجعة بنجاح.');
  }

  showReviewMessage(message) {
    const toast = document.getElementById('review-message');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 4000);
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

window.ResearchApp = ResearchApp;

