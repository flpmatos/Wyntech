'use strict';

/* =========================================================
   WYNTECH · PORTAL TÉCNICO — Solicitação Técnica
   JavaScript modular — ES6+
   ========================================================= */

/* ---------------------------------------------------------
   CONFIG — toda configuração centralizada aqui
   --------------------------------------------------------- */
const CONFIG = {
  // Link do grupo/conversa do WhatsApp que deve receber a solicitação.
  // Pode ser um link de grupo (https://chat.whatsapp.com/...) ou wa.me/<numero>.
  whatsappGroup: 'https://chat.whatsapp.com/EFL80AX7cZoLKElCFzq3F1',

  companyName: 'Wyntech',

  // Finalidades da requisição — editar aqui para adicionar/remover opções.
  purposeOptions: [
    'Nac',
    'Nome Novo',
    'Senha Adm',
    'Nac e Nome Novo',
    'Nac e Senha Adm',
    'Nome Novo e Senha Adm',
    'Nome Novo e Nac',
    'Senha Adm e Nac',
    'Senha Adm e Nome Novo'
  ],

  // Tipos de equipamento — editar aqui para adicionar novos equipamentos.
  equipmentTypes: [
    'Mini PC',
    'Notebook Externo',
    'Notebook Positivo',
    'Notebook Lenovo',
    'Totem',
    'Thin Client',
    'Estação Financeira',
    'Impressora',
    'Estacao Captura',
    'Dell',
    'Estacao Monitoramento',
    'Estacao Externa'
    
  ],

  macLength: 12,
  toastDurationMs: 3200
};

/* ---------------------------------------------------------
   state — estado da aplicação
   --------------------------------------------------------- */
const state = {
  isSubmitting: false,
  lastGeneratedMessage: ''
};

/* ---------------------------------------------------------
   DOM selectors — todos os elementos usados, centralizados
   --------------------------------------------------------- */
const dom = {};

function cacheDom() {
  dom.form = document.getElementById('techRequestForm');

  dom.purposeInput = document.getElementById('purposeInput');
  dom.fieldPurpose = document.getElementById('fieldPurpose');
  dom.errorPurpose = document.getElementById('errorPurpose');

  dom.campoReq = document.getElementById('campoReq');
  dom.campoMac = document.getElementById('campoMac');
  dom.campoNomeLogico = document.getElementById('campoNomeLogico');
  dom.campoTipoEquipamento = document.getElementById('campoTipoEquipamento');
  dom.campoSerial = document.getElementById('campoSerial');
  dom.campoTecnico = document.getElementById('campoTecnico');

  dom.fieldReq = document.getElementById('fieldReq');
  dom.fieldMac = document.getElementById('fieldMac');
  dom.fieldNomeLogico = document.getElementById('fieldNomeLogico');
  dom.fieldTipoEquipamento = document.getElementById('fieldTipoEquipamento');
  dom.fieldSerial = document.getElementById('fieldSerial');
  dom.fieldTecnico = document.getElementById('fieldTecnico');

  dom.macCounter = document.getElementById('macCounter');
  dom.macStatusIcon = document.getElementById('macStatusIcon');
  dom.errorMac = document.getElementById('errorMac');
  dom.btnPasteMac = document.getElementById('btnPasteMac');

  dom.btnSubmitForm = document.getElementById('btnSubmitForm');
  dom.formWarningText = document.getElementById('formWarningText');

  dom.reviewModalBackdrop = document.getElementById('reviewModalBackdrop');
  dom.btnCloseModal = document.getElementById('btnCloseModal');
  dom.btnBackEdit = document.getElementById('btnBackEdit');
  dom.formattedOutputContainer = document.getElementById('formattedOutputContainer');
  dom.copySuccessNotice = document.getElementById('copySuccessNotice');
  dom.btnCopyInline = document.getElementById('btnCopyInline');
  dom.btnCopyFooter = document.getElementById('btnCopyFooter');
  dom.copyBtnInlineText = document.getElementById('copyBtnInlineText');
  dom.copyBtnFooterText = document.getElementById('copyBtnFooterText');
  dom.btnDispatchWhatsapp = document.getElementById('btnDispatchWhatsapp');

  dom.systemToast = document.getElementById('systemToast');
  dom.systemToastIcon = document.getElementById('systemToastIcon');
  dom.systemToastText = document.getElementById('systemToastText');

  dom.clipboardFallback = document.getElementById('clipboardFallback');
}

/* ---------------------------------------------------------
   init — ponto de entrada
   --------------------------------------------------------- */
function init() {
  cacheDom();
  populatePurposeSelect();
  renderEquipmentOptions();
  setupFormValidation();
  setupMacInput();
  setupClipboard();
  setupModal();
  validateForm();
}

document.addEventListener('DOMContentLoaded', init);

/* ---------------------------------------------------------
   Renderização das opções (a partir de CONFIG)
   --------------------------------------------------------- */
function populatePurposeSelect() {
  const select = dom.purposeInput;
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Selecione a finalidade...';
  select.appendChild(placeholder);

  CONFIG.purposeOptions.forEach((option) => {
    const optionElement = document.createElement('option');
    optionElement.value = option;
    optionElement.textContent = option;
    select.appendChild(optionElement);
  });
}

function renderEquipmentOptions() {
  const select = dom.campoTipoEquipamento;
  select.innerHTML = '';

  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = 'Selecione o tipo de equipamento';
  select.appendChild(placeholder);

  CONFIG.equipmentTypes.forEach((type) => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type;
    select.appendChild(option);
  });
}

/* ---------------------------------------------------------
   setupFormValidation — listeners de validação ao vivo
   --------------------------------------------------------- */
function setupFormValidation() {
  const watchedFields = [
    dom.purposeInput,
    dom.campoReq,
    dom.campoNomeLogico,
    dom.campoTipoEquipamento,
    dom.campoSerial,
    dom.campoTecnico
  ];

  watchedFields.forEach((field) => {
    const evt = field.tagName === 'SELECT' ? 'change' : 'input';
    field.addEventListener(evt, () => validateForm());
    field.addEventListener('blur', () => validateForm());
  });

  dom.form.addEventListener('submit', handleFormSubmit);
}

/* ---------------------------------------------------------
   setupMacInput — máscara, normalização e contador do MAC
   --------------------------------------------------------- */
function setupMacInput() {
  dom.campoMac.addEventListener('input', () => {
    handleMacInput(dom.campoMac);
  });
}

function sanitizeMac(rawValue) {
  // Remove tudo que não for caractere hexadecimal (0-9, A-F),
  // eliminando ':', '-', espaços e qualquer outro separador.
  return rawValue
    .replace(/[^0-9a-fA-F]/g, '')
    .toUpperCase()
    .slice(0, CONFIG.macLength);
}

function handleMacInput(inputEl) {
  const clean = sanitizeMac(inputEl.value);
  inputEl.value = clean;

  const count = clean.length;
  const isComplete = count === CONFIG.macLength;

  dom.macCounter.textContent = `${count}/${CONFIG.macLength}`;
  dom.macCounter.classList.toggle('mac-counter--complete', isComplete);

  const iconEl = dom.macStatusIcon.querySelector('.material-symbols-outlined');
  dom.macStatusIcon.classList.toggle('mac-status-icon--complete', isComplete);
  iconEl.textContent = isComplete ? 'check_circle' : (count > 0 ? 'cancel' : 'fingerprint');

  validateMac();
  validateForm();
}

/* ---------------------------------------------------------
   setupClipboard — botão "Colar" e cópia da mensagem
   --------------------------------------------------------- */
function setupClipboard() {
  dom.btnPasteMac.addEventListener('click', pasteMacFromClipboard);
  dom.btnCopyInline.addEventListener('click', copyGeneratedMessage);
  dom.btnCopyFooter.addEventListener('click', copyGeneratedMessage);
}

async function pasteMacFromClipboard() {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error('Clipboard API indisponível');
    }
    const text = await navigator.clipboard.readText();
    dom.campoMac.value = text;
    handleMacInput(dom.campoMac);
    showToast('MAC colado da área de transferência.', 'content_paste', 'success');
  } catch (err) {
    showToast('Não foi possível colar automaticamente. Digite o MAC manualmente.', 'warning', 'warning');
  }
}

async function copyToClipboard(text) {
  // Tenta a Clipboard API moderna primeiro.
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    // segue para o fallback abaixo
  }

  // Fallback com textarea + execCommand para navegadores/contextos sem Clipboard API.
  try {
    const fallback = dom.clipboardFallback;
    fallback.value = text;
    fallback.style.position = 'fixed';
    fallback.style.top = '0';
    fallback.style.left = '0';
    fallback.focus();
    fallback.select();
    const ok = document.execCommand('copy');
    return ok;
  } catch (err) {
    return false;
  }
}

async function copyGeneratedMessage() {
  const message = state.lastGeneratedMessage || generateWhatsAppMessage();
  const success = await copyToClipboard(message);

  if (success) {
    dom.copySuccessNotice.classList.add('is-visible');
    setCopyButtonsLabel('Copiado!');
    showToast('Solicitação copiada com sucesso.', 'check_circle', 'success');
    setTimeout(() => setCopyButtonsLabel(null), 3000);
  } else {
    showToast('Não foi possível copiar. Selecione o texto manualmente.', 'error', 'error');
  }

  return success;
}

function setCopyButtonsLabel(label) {
  dom.copyBtnInlineText.textContent = label || 'Copiar mensagem';
  dom.copyBtnFooterText.textContent = label ? 'Texto copiado!' : 'Copiar texto';
}

/* ---------------------------------------------------------
   validateMac / validateForm
   --------------------------------------------------------- */
function validateMac() {
  const mac = dom.campoMac.value.trim();
  const isValid = mac.length === CONFIG.macLength;

  // O hint/erro do MAC funciona como contador vivo: fica visível
  // enquanto o MAC estiver incompleto (inclusive vazio) e some ao completar.
  dom.errorMac.style.display = isValid ? 'none' : 'flex';
  dom.fieldMac.classList.toggle('field--invalid', mac.length > 0 && !isValid);
  dom.fieldMac.classList.toggle('field--valid', isValid);
  return isValid;
}

function validateField(fieldWrapper, inputEl) {
  const value = inputEl.value.trim();
  const isValid = value.length > 0;
  // O erro só é exibido explicitamente durante a validação de submit
  // (via showFieldErrors), mas assim que o campo se torna válido o
  // estado de erro é sempre removido — corrige o bug em que o campo
  // ficava com "field--invalid" e "field--valid" simultâneos após o
  // usuário corrigir o valor sem reenviar o formulário.
  fieldWrapper.classList.toggle('field--valid', isValid);
  if (isValid) {
    fieldWrapper.classList.remove('field--invalid');
  }
  return isValid;
}

function validateForm({ showErrors = false } = {}) {
  const reqOk = dom.campoReq.value.trim().length > 0;
  const macOk = validateMac();
  const nomeLogicoOk = dom.campoNomeLogico.value.trim().length > 0;
  const tipoOk = dom.campoTipoEquipamento.value.trim().length > 0;
  const serialOk = dom.campoSerial.value.trim().length > 0;
  const tecnicoOk = dom.campoTecnico.value.trim().length > 0;
  const purposeOk = dom.purposeInput.value.trim().length > 0;

  validateField(dom.fieldReq, dom.campoReq);
  validateField(dom.fieldNomeLogico, dom.campoNomeLogico);
  dom.fieldTipoEquipamento.classList.toggle('field--valid', tipoOk);
  if (tipoOk) dom.fieldTipoEquipamento.classList.remove('field--invalid');
  dom.fieldPurpose.classList.toggle('field--valid', purposeOk);
  if (purposeOk) dom.fieldPurpose.classList.remove('field--invalid');
  validateField(dom.fieldSerial, dom.campoSerial);
  validateField(dom.fieldTecnico, dom.campoTecnico);

  if (showErrors) {
    dom.fieldReq.classList.toggle('field--invalid', !reqOk);
    dom.fieldNomeLogico.classList.toggle('field--invalid', !nomeLogicoOk);
    dom.fieldTipoEquipamento.classList.toggle('field--invalid', !tipoOk);
    dom.fieldPurpose.classList.toggle('field--invalid', !purposeOk);
    dom.fieldSerial.classList.toggle('field--invalid', !serialOk);
    dom.fieldTecnico.classList.toggle('field--invalid', !tecnicoOk);
  }

  const isAllValid = reqOk && macOk && nomeLogicoOk && tipoOk && serialOk && tecnicoOk && purposeOk;

  dom.btnSubmitForm.disabled = !isAllValid;
  dom.formWarningText.style.visibility = isAllValid ? 'hidden' : 'visible';

  return isAllValid;
}

function showFieldErrors() {
  validateForm({ showErrors: true });
}

/* ---------------------------------------------------------
   generateWhatsAppMessage — monta a mensagem padronizada
   --------------------------------------------------------- */
function generateWhatsAppMessage() {
  const data = {
    finalidade: dom.purposeInput.value.trim(),
    req: dom.campoReq.value.trim(),
    mac: dom.campoMac.value.trim(),
    nomeLogico: dom.campoNomeLogico.value.trim(),
    tipoEquipamento: dom.campoTipoEquipamento.value.trim(),
    serial: dom.campoSerial.value.trim(),
    tecnico: dom.campoTecnico.value.trim()
  };

  const message = [
    '🚨 SOLICITAÇÃO TÉCNICA',
    '',
    'FINALIDADE',
    data.finalidade,
    '',
    'DADOS DA SOLICITAÇÃO',
    '',
    'REQ:',
    data.req,
    '',
    'MAC ADDRESS:',
    data.mac,
    '',
    'NOME LÓGICO:',
    data.nomeLogico,
    '',
    'TIPO DE EQUIPAMENTO:',
    data.tipoEquipamento,
    '',
    'NÚMERO DE SÉRIE:',
    data.serial,
    '',
    'TÉCNICO:',
    data.tecnico,
    '',
    '────────────────',
    '',
    'Solicitação enviada através do Portal Técnico.'
  ].join('\n');

  state.lastGeneratedMessage = message;
  return message;
}

/* ---------------------------------------------------------
   handleFormSubmit — clique em "Enviar para WhatsApp"
   --------------------------------------------------------- */
function handleFormSubmit(event) {
  event.preventDefault();
  if (state.isSubmitting) return;

  const isValid = validateForm();

  if (!isValid) {
    showFieldErrors();
    showToast('Complete todos os campos obrigatórios para continuar.', 'warning', 'warning');
    focusFirstInvalidField();
    return;
  }

  openReviewModal();
}

function focusFirstInvalidField() {
  const invalidField = document.querySelector('.field--invalid .field__input, .field--invalid .field__select');
  if (invalidField) {
    invalidField.focus();
  }
}

/* ---------------------------------------------------------
   Modal de revisão
   --------------------------------------------------------- */
function setupModal() {
  dom.btnCloseModal.addEventListener('click', closeReviewModal);
  dom.btnBackEdit.addEventListener('click', closeReviewModal);
  dom.reviewModalBackdrop.addEventListener('click', (event) => {
    if (event.target === dom.reviewModalBackdrop) closeReviewModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && dom.reviewModalBackdrop.classList.contains('is-open')) {
      closeReviewModal();
    }
  });
  dom.btnDispatchWhatsapp.addEventListener('click', sendToWhatsApp);
}

function openReviewModal() {
  const message = generateWhatsAppMessage();
  dom.formattedOutputContainer.textContent = message;
  dom.copySuccessNotice.classList.remove('is-visible');
  setCopyButtonsLabel(null);

  dom.reviewModalBackdrop.classList.add('is-open');
  dom.btnCloseModal.focus();
}

function closeReviewModal() {
  dom.reviewModalBackdrop.classList.remove('is-open');
}

/* ---------------------------------------------------------
   sendToWhatsApp — copia a mensagem e abre o WhatsApp
   --------------------------------------------------------- */
async function sendToWhatsApp() {
  if (state.isSubmitting) return;
  state.isSubmitting = true;
  setSubmitLoading(true);

  // IMPORTANTE: o window.open() precisa acontecer de forma síncrona,
  // ainda dentro do gesto de clique do usuário. Se for atrasado por um
  // await ou setTimeout antes de rodar, o navegador (principalmente
  // Safari e Chrome no celular) bloqueia o pop-up silenciosamente — o
  // WhatsApp nunca abre e a mensagem nunca é enviada, mesmo com o toast
  // de sucesso aparecendo normalmente. Por isso abrimos primeiro, e só
  // depois copiamos a mensagem para a área de transferência.
  const whatsappWindow = window.open(CONFIG.whatsappGroup, '_blank', 'noopener');

  if (!whatsappWindow) {
    showToast('Não foi possível abrir o WhatsApp. Verifique o bloqueador de pop-ups do navegador.', 'warning', 'warning');
  }

  try {
    await copyGeneratedMessage();
    if (whatsappWindow) {
      showToast('WhatsApp aberto! Cole a mensagem (já copiada) no grupo.', 'send', 'success');
    }
  } catch (err) {
    showToast('WhatsApp aberto, mas não foi possível copiar a mensagem. Copie manualmente.', 'error', 'error');
  } finally {
    setSubmitLoading(false);
    state.isSubmitting = false;
  }
}

function setSubmitLoading(isLoading) {
  dom.btnSubmitForm.classList.toggle('btn-submit--loading', isLoading);
}

/* ---------------------------------------------------------
   showError / showSuccess — feedback visual (toast)
   --------------------------------------------------------- */
function showToast(message, iconName = 'info', variant = 'info') {
  dom.systemToastText.textContent = message;
  dom.systemToastIcon.textContent = iconName;
  dom.systemToast.classList.remove('toast--success', 'toast--error');

  if (variant === 'success') dom.systemToast.classList.add('toast--success');
  if (variant === 'error') dom.systemToast.classList.add('toast--error');

  dom.systemToast.classList.add('is-visible');

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    dom.systemToast.classList.remove('is-visible');
  }, CONFIG.toastDurationMs);
}

function showError(message) {
  showToast(message, 'error', 'error');
}

function showSuccess(message) {
  showToast(message, 'check_circle', 'success');
}

/* ---------------------------------------------------------
   resetForm — limpa o formulário após envio (opcional)
   --------------------------------------------------------- */
function resetForm() {
  dom.form.reset();
  handleMacInput(dom.campoMac);
  dom.purposeInput.value = '';

  document.querySelectorAll('.field').forEach((field) => {
    field.classList.remove('field--invalid', 'field--valid');
  });

  validateForm();
}
