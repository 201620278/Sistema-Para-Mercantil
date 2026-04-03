// Load produtos page
function loadProdutos() {
    $.ajax({
        url: `${API_URL}/produtos`,
        method: 'GET',
        success: function(produtos) {
            renderProdutos(produtos);
        },
        error: function() {
            $('#page-content').html('<div class="alert alert-danger">Erro ao carregar produtos!</div>');
        }
    });
}

// Render produtos
function renderProdutos(produtos) {
    const html = `
        <div class="card">
            <div class="card-header">
                <div class="row">
                    <div class="col-md-6">
                        <i class="fas fa-box"></i> Lista de Produtos
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-primary btn-sm" onclick="showProdutoModal()">
                            <i class="fas fa-plus"></i> Novo Produto
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Produto</th>
                                <th>Categoria</th>
                                <th>Unidade</th>
                                <th>Preço Venda</th>
                                <th>Estoque</th>
                                <th>Mínimo</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${produtos.map(p => `
                                <tr>
                                    <td>${p.codigo || '-'}</td>
                                    <td>${p.nome}</td>
                                    <td>${p.categoria || '-'}</td>
                                    <td>${p.unidade || 'un'}</td>
                                    <td>${formatCurrency(p.preco_venda)}</td>
                                    <td class="${p.estoque_atual <= p.estoque_minimo ? 'text-danger fw-bold' : ''}">
                                        ${p.estoque_atual} ${p.unidade || 'un'}
                                    </td>
                                    <td>${p.estoque_minimo} ${p.unidade || 'un'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewProduto(${p.id})" title="Detalhes">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="showHistoricoPrecos(${p.id})" title="Histórico de preços">
                                            <i class="fas fa-history"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" onclick="editProduto(${p.id})" title="Editar">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteProduto(${p.id})" title="Excluir">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${produtos.length === 0 ? '<tr><td colspan="8" class="text-center">Nenhum produto cadastrado</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    $('#page-content').html(html);
}

// Show produto modal
function showProdutoModal(produto = null) {
    const isEdit = produto !== null;
    const title = isEdit ? 'Editar Produto' : 'Novo Produto';
    
    const lucro = isEdit && produto.lucro_percentual !== undefined ? produto.lucro_percentual : '';
    const modalHtml = `
        <div class="modal fade" id="produtoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="produtoForm">
                            <input type="hidden" id="produtoId" value="${isEdit ? produto.id : ''}">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="codigo" class="form-label">Código</label>
                                    <input type="text" class="form-control" id="codigo" value="${isEdit ? (produto.codigo || '') : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="nome" class="form-label">Nome *</label>
                                    <input type="text" class="form-control" id="nome" required value="${isEdit ? produto.nome : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="categoria" class="form-label">Categoria</label>
                                    <input type="text" class="form-control" id="categoria" value="${isEdit ? (produto.categoria || '') : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="unidade" class="form-label">Unidade</label>
                                    <select class="form-control" id="unidade">
                                        <option value="un" ${isEdit && produto.unidade === 'un' ? 'selected' : ''}>Unidade</option>
                                        <option value="kg" ${isEdit && produto.unidade === 'kg' ? 'selected' : ''}>Quilograma</option>
                                        <option value="g" ${isEdit && produto.unidade === 'g' ? 'selected' : ''}>Grama</option>
                                        <option value="l" ${isEdit && produto.unidade === 'l' ? 'selected' : ''}>Litro</option>
                                        <option value="ml" ${isEdit && produto.unidade === 'ml' ? 'selected' : ''}>Mililitro</option>
                                    </select>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="preco_compra" class="form-label">Preço de Compra</label>
                                    <input type="number" step="0.01" class="form-control" id="preco_compra" value="${isEdit ? (produto.preco_compra || 0) : 0}">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="lucro_percentual" class="form-label">% Lucro Real</label>
                                    <input type="number" step="0.01" class="form-control" id="lucro_percentual" placeholder="%" value="${lucro}">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="preco_venda" class="form-label">Preço de Venda *</label>
                                    <input type="number" step="0.01" class="form-control" id="preco_venda" required value="${isEdit ? produto.preco_venda : 0}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="estoque_atual" class="form-label">Estoque Atual</label>
                                    <input type="number" step="0.01" class="form-control" id="estoque_atual" value="${isEdit ? produto.estoque_atual : 0}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="estoque_minimo" class="form-label">Estoque Mínimo</label>
                                    <input type="number" step="0.01" class="form-control" id="estoque_minimo" value="${isEdit ? (produto.estoque_minimo || 0) : 0}">
                                </div>
                                <div class="col-md-12 mb-3">
                                    <label for="fornecedor" class="form-label">Fornecedor</label>
                                    <input type="text" class="form-control" id="fornecedor" value="${isEdit ? (produto.fornecedor || '') : ''}">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveProduto()">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#modal-container').html(modalHtml);

    // Sempre que preço de compra mudar, recalcula preço de venda com base na margem já definida
    function atualizarPrecoVenda() {
        const precoCompra = parseFloat($('#preco_compra').val()) || 0;
        const margem = parseFloat($('#lucro_percentual').val());
        if (!isNaN(margem) && margem < 100) {
            const precoVenda = precoCompra / (1 - (margem / 100));
            if (isFinite(precoVenda)) {
                $('#preco_venda').val(precoVenda.toFixed(2));
            }
        }
    }
    $('#preco_compra').on('input', atualizarPrecoVenda);
    $('#lucro_percentual').on('input', atualizarPrecoVenda);

    // Se for edição, ao abrir o modal já faz o cálculo para garantir consistência
    if (produto) {
        setTimeout(atualizarPrecoVenda, 100);
    }

    // Permite edição manual do preço de venda normalmente
    $('#produtoModal').modal('show');
}

// Save produto
function saveProduto() {
    const id = $('#produtoId').val();
    const data = {
        codigo: $('#codigo').val(),
        nome: $('#nome').val(),
        categoria: $('#categoria').val(),
        unidade: $('#unidade').val(),
        preco_compra: parseFloat($('#preco_compra').val()),
        preco_venda: parseFloat($('#preco_venda').val()),
        lucro_percentual: $('#lucro_percentual').val() !== '' ? parseFloat($('#lucro_percentual').val()) : undefined,
        estoque_atual: parseFloat($('#estoque_atual').val()),
        estoque_minimo: parseFloat($('#estoque_minimo').val()),
        fornecedor: $('#fornecedor').val()
    };
    
    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;
    const method = id ? 'PUT' : 'POST';
    
    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function() {
            $('#produtoModal').modal('hide');
            showNotification('Produto salvo com sucesso!');
            loadProdutos();
        },
        error: function(xhr) {
            showNotification('Erro ao salvar produto: ' + xhr.responseJSON?.error || 'Erro desconhecido', 'danger');
        }
    });
}

// Edit produto
function editProduto(id) {
    $.ajax({
        url: `${API_URL}/produtos/${id}`,
        method: 'GET',
        success: function(produto) {
            showProdutoModal(produto);
        }
    });
}

// View produto
function viewProduto(id) {
    $.ajax({
        url: `${API_URL}/produtos/${id}`,
        method: 'GET',
        success: function(produto) {
            const modalHtml = `
                <div class="modal fade" id="viewProdutoModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalhes do Produto</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p><strong>Código:</strong> ${produto.codigo || '-'}</p>
                                <p><strong>Nome:</strong> ${produto.nome}</p>
                                <p><strong>Categoria:</strong> ${produto.categoria || '-'}</p>
                                <p><strong>Unidade:</strong> ${produto.unidade || 'un'}</p>
                                <p><strong>Preço Compra:</strong> ${formatCurrency(produto.preco_compra || 0)}</p>
                                <p><strong>Preço Venda:</strong> ${formatCurrency(produto.preco_venda)}</p>
                                <p><strong>Estoque Atual:</strong> ${produto.estoque_atual} ${produto.unidade || 'un'}</p>
                                <p><strong>Estoque Mínimo:</strong> ${produto.estoque_minimo} ${produto.unidade || 'un'}</p>
                                <p><strong>Fornecedor:</strong> ${produto.fornecedor || '-'}</p>
                                <p><strong>Cadastrado em:</strong> ${formatDateTime(produto.created_at)}</p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('#modal-container').html(modalHtml);
            $('#viewProdutoModal').modal('show');
        }
    });
}

// Histórico de preços
function showHistoricoPrecos(produtoId) {
    $.ajax({
        url: `${API_URL}/produtos/${produtoId}/historico-precos`,
        method: 'GET',
        success: function(rows) {
            const modalHtml = `
                <div class="modal fade" id="historicoPrecosModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Histórico de preços</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="table-responsive">
                                    <table class="table table-sm table-striped">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>P. compra (de →)</th>
                                                <th>P. venda (de →)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${rows.length ? rows.map(r => `
                                                <tr>
                                                    <td>${formatDateTime(r.created_at)}</td>
                                                    <td>${formatCurrency(r.preco_compra_anterior || 0)} → ${formatCurrency(r.preco_compra_novo || 0)}</td>
                                                    <td>${formatCurrency(r.preco_venda_anterior || 0)} → ${formatCurrency(r.preco_venda_novo || 0)}</td>
                                                </tr>
                                            `).join('') : '<tr><td colspan="3" class="text-center">Nenhuma alteração de preço registrada ainda.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            $('#modal-container').html(modalHtml);
            $('#historicoPrecosModal').modal('show');
        },
        error: function() {
            showNotification('Erro ao carregar histórico de preços.', 'danger');
        }
    });
}

// Delete produto
function deleteProduto(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        $.ajax({
            url: `${API_URL}/produtos/${id}`,
            method: 'DELETE',
            success: function() {
                showNotification('Produto excluído com sucesso!');
                loadProdutos();
            },
            error: function(xhr) {
                showNotification('Erro ao excluir produto: ' + xhr.responseJSON?.error || 'Erro desconhecido', 'danger');
            }
        });
    }
}
