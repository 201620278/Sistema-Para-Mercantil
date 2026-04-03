let fornecedoresCache = [];

function loadFornecedores() {
  $('#page-content').html(`
    <div class="fornecedores-page">
      <div class="page-header">
        <h2>Cadastro de Fornecedores</h2>
        <p>Cadastre, edite e exclua fornecedores do sistema.</p>
      </div>

      <div class="card">
        <div class="card-body">
          <h3 id="tituloFormularioFornecedor">Novo Fornecedor</h3>

          <input type="hidden" id="fornecedorId">

          <div class="form-grid">
            <div class="form-group">
              <label>Nome *</label>
              <input type="text" id="nomeFornecedor" class="form-control" placeholder="Nome do fornecedor">
            </div>
            <div class="form-group">
              <label>Razão Social</label>
              <input type="text" id="razaoSocialFornecedor" class="form-control" placeholder="Razão social">
            </div>
            <div class="form-group">
              <label>CPF/CNPJ</label>
              <input type="text" id="cpfCnpjFornecedor" class="form-control" placeholder="CPF ou CNPJ">
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input type="text" id="telefoneFornecedor" class="form-control" placeholder="Telefone">
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input type="email" id="emailFornecedor" class="form-control" placeholder="E-mail">
            </div>
            <div class="form-group">
              <label>Contato</label>
              <input type="text" id="contatoFornecedor" class="form-control" placeholder="Pessoa de contato">
            </div>
            <div class="form-group">
              <label>CEP</label>
              <input type="text" id="cepFornecedor" class="form-control" placeholder="CEP">
            </div>
            <div class="form-group">
              <label>Rua</label>
              <input type="text" id="ruaFornecedor" class="form-control" placeholder="Rua">
            </div>
            <div class="form-group">
              <label>Número</label>
              <input type="text" id="numeroFornecedor" class="form-control" placeholder="Número">
            </div>
            <div class="form-group">
              <label>Bairro</label>
              <input type="text" id="bairroFornecedor" class="form-control" placeholder="Bairro">
            </div>
            <div class="form-group">
              <label>Cidade</label>
              <input type="text" id="cidadeFornecedor" class="form-control" placeholder="Cidade">
            </div>
            <div class="form-group">
              <label>UF</label>
              <input type="text" id="ufFornecedor" class="form-control" maxlength="2" placeholder="UF">
            </div>
            <div class="form-group form-group-full">
              <label>Observações</label>
              <textarea id="observacoesFornecedor" class="form-control" rows="3" placeholder="Observações"></textarea>
            </div>
          </div>

          <div class="acoes-formulario">
            <button class="btn btn-primary" onclick="saveFornecedor()">Salvar</button>
            <button class="btn btn-secondary" onclick="limparFormularioFornecedor()">Cancelar</button>
          </div>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-body">
          <div class="fornecedores-topo-lista">
            <h3>Fornecedores cadastrados</h3>
            <input
              type="text"
              id="buscaFornecedor"
              class="form-control"
              placeholder="Buscar fornecedor..."
              oninput="filtrarFornecedores()"
            >
          </div>

          <div class="table-responsive">
            <table class="table tabela-fornecedores">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th>CPF/CNPJ</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="tabelaFornecedoresBody">
                <tr>
                  <td colspan="7" class="text-center">Carregando...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `);

  // Adiciona evento para buscar endereço pelo CEP
  setTimeout(() => {
    $('#cepFornecedor').off('blur').on('blur', function() {
      const cep = $(this).val().replace(/\D/g, '');
      if (cep.length === 8) {
        buscarEnderecoPorCEP(cep);
      }
    });
  }, 300);

  carregarListaFornecedores();
// Busca endereço pelo CEP usando a API ViaCEP
function buscarEnderecoPorCEP(cep) {
  if (!cep) return;
  $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function(data) {
    if (!('erro' in data)) {
      $('#ruaFornecedor').val(data.logradouro || '');
      $('#bairroFornecedor').val(data.bairro || '');
      $('#cidadeFornecedor').val(data.localidade || '');
      $('#ufFornecedor').val(data.uf || '');
    } else {
      showNotification('CEP não encontrado.', 'warning');
    }
  }).fail(function() {
    showNotification('Erro ao buscar o CEP.', 'danger');
  });
}
}

async function carregarListaFornecedores() {
  const tbody = $('#tabelaFornecedoresBody');
  tbody.html(`
    <tr>
      <td colspan="7" class="text-center">Carregando...</td>
    </tr>
  `);

  try {
    const response = await fetch('/api/fornecedores', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao carregar fornecedores.');
    }

    fornecedoresCache = Array.isArray(data) ? data : [];
    renderFornecedores(fornecedoresCache);
  } catch (error) {
    console.error('Erro ao carregar fornecedores:', error);
    tbody.html(`
      <tr>
        <td colspan="7" class="text-center text-danger">Erro ao carregar fornecedores.</td>
      </tr>
    `);
  }
}

function renderFornecedores(lista) {
  const tbody = $('#tabelaFornecedoresBody');

  if (!lista || lista.length === 0) {
    tbody.html(`
      <tr>
        <td colspan="7" class="text-center">Nenhum fornecedor cadastrado.</td>
      </tr>
    `);
    return;
  }

  const linhas = lista.map(fornecedor => `
    <tr>
      <td>${fornecedor.id}</td>
      <td>${escapeHtml(fornecedor.nome || '')}</td>
      <td>${escapeHtml(fornecedor.contato || '-')}</td>
      <td>${escapeHtml(fornecedor.telefone || '-')}</td>
      <td>${escapeHtml(fornecedor.cidade || '-')}</td>
      <td>${escapeHtml(fornecedor.cpf_cnpj || '-')}</td>
      <td>
        <div class="acoes-tabela">
          <button class="btn btn-sm btn-warning" onclick="editFornecedor(${fornecedor.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteFornecedor(${fornecedor.id})">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.html(linhas);
}

async function saveFornecedor() {
  const fornecedorId = $('#fornecedorId').val().trim();

  const fornecedor = {
    nome: $('#nomeFornecedor').val().trim(),
    razao_social: $('#razaoSocialFornecedor').val().trim(),
    cpf_cnpj: $('#cpfCnpjFornecedor').val().trim(),
    telefone: $('#telefoneFornecedor').val().trim(),
    email: $('#emailFornecedor').val().trim(),
    contato: $('#contatoFornecedor').val().trim(),
    cep: $('#cepFornecedor').val().trim(),
    rua: $('#ruaFornecedor').val().trim(),
    numero: $('#numeroFornecedor').val().trim(),
    bairro: $('#bairroFornecedor').val().trim(),
    cidade: $('#cidadeFornecedor').val().trim(),
    uf: $('#ufFornecedor').val().trim().toUpperCase(),
    observacoes: $('#observacoesFornecedor').val().trim()
  };

  if (!fornecedor.nome) {
    showNotification('Informe o nome do fornecedor.', 'warning');
    $('#nomeFornecedor').focus();
    return;
  }

  const isEdicao = !!fornecedorId;
  const url = isEdicao ? `/api/fornecedores/${fornecedorId}` : '/api/fornecedores';
  const method = isEdicao ? 'PUT' : 'POST';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(fornecedor)
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification(data.error || 'Erro ao salvar fornecedor.', 'danger');
      return;
    }

    showNotification(data.message || 'Fornecedor salvo com sucesso.', 'success');
    limparFormularioFornecedor();
    await carregarListaFornecedores();
  } catch (error) {
    console.error('Erro ao salvar fornecedor:', error);
    showNotification('Erro de conexão ao salvar fornecedor.', 'danger');
  }
}

async function editFornecedor(id) {
  try {
    const response = await fetch(`/api/fornecedores/${id}`, {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const fornecedor = await response.json();

    if (!response.ok) {
      showNotification(fornecedor.error || 'Erro ao buscar fornecedor.', 'danger');
      return;
    }

    $('#fornecedorId').val(fornecedor.id || '');
    $('#nomeFornecedor').val(fornecedor.nome || '');
    $('#razaoSocialFornecedor').val(fornecedor.razao_social || '');
    $('#cpfCnpjFornecedor').val(fornecedor.cpf_cnpj || '');
    $('#telefoneFornecedor').val(fornecedor.telefone || '');
    $('#emailFornecedor').val(fornecedor.email || '');
    $('#contatoFornecedor').val(fornecedor.contato || '');
    $('#cepFornecedor').val(fornecedor.cep || '');
    $('#ruaFornecedor').val(fornecedor.rua || '');
    $('#numeroFornecedor').val(fornecedor.numero || '');
    $('#bairroFornecedor').val(fornecedor.bairro || '');
    $('#cidadeFornecedor').val(fornecedor.cidade || '');
    $('#ufFornecedor').val(fornecedor.uf || '');
    $('#observacoesFornecedor').val(fornecedor.observacoes || '');

    $('#tituloFormularioFornecedor').text('Editar Fornecedor');

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } catch (error) {
    console.error('Erro ao editar fornecedor:', error);
    showNotification('Erro ao carregar dados do fornecedor.', 'danger');
  }
}

async function deleteFornecedor(id) {
  if (!confirm('Deseja realmente excluir este fornecedor?')) return;

  try {
    const response = await fetch(`/api/fornecedores/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showNotification(data.error || 'Erro ao excluir fornecedor.', 'danger');
      return;
    }

    showNotification(data.message || 'Fornecedor excluído com sucesso.', 'success');

    if ($('#fornecedorId').val() === String(id)) {
      limparFormularioFornecedor();
    }

    await carregarListaFornecedores();
  } catch (error) {
    console.error('Erro ao excluir fornecedor:', error);
    showNotification('Erro de conexão ao excluir fornecedor.', 'danger');
  }
}

function limparFormularioFornecedor() {
  $('#fornecedorId').val('');
  $('#nomeFornecedor').val('');
  $('#razaoSocialFornecedor').val('');
  $('#cpfCnpjFornecedor').val('');
  $('#telefoneFornecedor').val('');
  $('#emailFornecedor').val('');
  $('#contatoFornecedor').val('');
  $('#cepFornecedor').val('');
  $('#ruaFornecedor').val('');
  $('#numeroFornecedor').val('');
  $('#bairroFornecedor').val('');
  $('#cidadeFornecedor').val('');
  $('#ufFornecedor').val('');
  $('#observacoesFornecedor').val('');

  $('#tituloFormularioFornecedor').text('Novo Fornecedor');
}

function filtrarFornecedores() {
  const termo = ($('#buscaFornecedor').val() || '').toLowerCase().trim();

  if (!termo) {
    renderFornecedores(fornecedoresCache);
    return;
  }

  const filtrados = fornecedoresCache.filter(f => {
    return [
      f.nome,
      f.razao_social,
      f.cpf_cnpj,
      f.telefone,
      f.email,
      f.contato,
      f.cidade
    ]
      .filter(Boolean)
      .some(valor => String(valor).toLowerCase().includes(termo));
  });

  renderFornecedores(filtrados);
}

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
