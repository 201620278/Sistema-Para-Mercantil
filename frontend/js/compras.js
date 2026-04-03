
// Global variable for current products list
let produtosList = [];

// Load compras page
function loadCompras() {
    // Load products for dropdown
    $.ajax({
        url: `${API_URL}/produtos`,
        method: 'GET',
        success: function(produtos) {
            produtosList = produtos;
            
            $.ajax({
                url: `${API_URL}/compras`,
                method: 'GET',
                success: function(compras) {
                    renderCompras(compras);
                },
                error: function() {
                    $('#page-content').html('<div class="alert alert-danger">Erro ao carregar compras!</div>');
                }
            });
        }
    });
}

// Render compras
function renderCompras(compras) {
    const html = `
        <div class="card">
            <div class="card-header">
                <div class="row">
                    <div class="col-md-6">
                        <i class="fas fa-shopping-cart"></i> Lista de Compras
                    </div>
                    <div class="col-md-6 text-end">
                        <button class="btn btn-primary btn-sm" onclick="showCompraModal()">
                            <i class="fas fa-plus"></i> Nova Compra
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>Nota Fiscal</th>
                                <th>Data</th>
                                <th>Fornecedor</th>
                                <th>Total</th>
                                <th>Itens</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${compras.map(c => `
                                <tr>
                                    <td>${c.nota_fiscal || '-'}</td>
                                    <td>${formatDate(c.data_compra)}</td>
                                    <td>${c.fornecedor || '-'}</td>
                                    <td>${formatCurrency(c.total)}</td>
                                    <td>${c.total_itens}</td>
                                    <td>
                                        <span class="badge bg-${c.status === 'concluida' ? 'success' : 'warning'}">
                                            ${c.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewCompra(${c.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteCompra(${c.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${compras.length === 0 ? '<tr><td colspan="7" class="text-center">Nenhuma compra registrada</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    $('#page-content').html(html);
}

// Show compra modal
function showCompraModal(compra = null) {
    const isEdit = compra !== null;
    const title = isEdit ? 'Editar Compra' : 'Nova Compra';
    
    const modalHtml = `
        <div class="modal fade" id="compraModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="compraForm">
                            <input type="hidden" id="compraId" value="${isEdit ? compra.id : ''}">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="nota_fiscal" class="form-label">Nota Fiscal *</label>
                                    <input type="text" class="form-control" id="nota_fiscal" required value="${isEdit ? (compra.nota_fiscal || '') : ''}">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="data_compra" class="form-label">Data da Compra *</label>
                                    <input type="date" class="form-control" id="data_compra" required value="${isEdit ? compra.data_compra : new Date().toISOString().split('T')[0]}">
                                </div>
                                <div class="col-md-12 mb-3">
                                    <label for="fornecedor" class="form-label">Fornecedor</label>
                                    <input type="text" class="form-control" id="fornecedor" value="${isEdit ? (compra.fornecedor || '') : ''}">
                                </div>
                            </div>
                            
                            <hr>
                            <h6>Itens da Compra</h6>
                            <div id="itensCompra">
                                ${isEdit && compra.itens ? renderItensCompra(compra.itens) : ''}
                            </div>
                            
                            <button type="button" class="btn btn-success btn-sm mt-2" onclick="addItemCompra()">
                                <i class="fas fa-plus"></i> Adicionar Item
                            </button>
                            
                            <hr>
                            <div class="row">
                                <div class="col-md-12 text-end">
                                    <h5>Total: <span id="totalCompra">${isEdit ? formatCurrency(compra.total) : 'R$ 0,00'}</span></h5>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" onclick="saveCompra()">Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#modal-container').html(modalHtml);
    $('#compraModal').modal('show');
    
    if (!isEdit) {
        addItemCompra();
    }
}

// Render itens da compra
function renderItensCompra(itens) {
    let html = '';
    itens.forEach((item, index) => {
        html += `
            <div class="row mb-2 item-compra" data-index="${index}">
                <div class="col-md-5">
                    <select class="form-control produto-select" data-index="${index}" onchange="atualizarPrecoItem(${index})">
                        <option value="">Selecione um produto</option>
                        ${produtosList.map(p => `
                            <option value="${p.id}" data-preco="${p.preco_compra || 0}" ${item.produto_id == p.id ? 'selected' : ''}>
                                ${p.nome} - ${formatCurrency(p.preco_compra || 0)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="col-md-2">
                    <input type="number" step="0.01" class="form-control quantidade" placeholder="Quantidade" data-index="${index}" value="${item.quantidade}" onchange="calcularSubtotalItem(${index})">
                </div>
                <div class="col-md-2">
                    <input type="number" step="0.01" class="form-control preco" placeholder="Preço" data-index="${index}" value="${item.preco_unitario}" onchange="calcularSubtotalItem(${index})">
                </div>
                <div class="col-md-2">
                    <input type="text" class="form-control subtotal" readonly placeholder="Subtotal" data-index="${index}" value="${formatCurrency(item.subtotal)}">
                </div>
                <div class="col-md-1">
                    <button type="button" class="btn btn-danger btn-sm" onclick="removerItemCompra(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    return html;
}

// Add item to compra
function addItemCompra() {
    const index = $('.item-compra').length;
    const itemHtml = `
        <div class="row mb-2 item-compra" data-index="${index}">
            <div class="col-md-5">
                <select class="form-control produto-select" data-index="${index}" onchange="atualizarPrecoItem(${index})">
                    <option value="">Selecione um produto</option>
                    ${produtosList.map(p => `
                        <option value="${p.id}" data-preco="${p.preco_compra || 0}">
                            ${p.nome} - ${formatCurrency(p.preco_compra || 0)}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="col-md-2">
                <input type="number" step="0.01" class="form-control quantidade" placeholder="Quantidade" data-index="${index}" onchange="calcularSubtotalItem(${index})">
            </div>
            <div class="col-md-2">
                <input type="number" step="0.01" class="form-control preco" placeholder="Preço" data-index="${index}" onchange="calcularSubtotalItem(${index})">
            </div>
            <div class="col-md-2">
                <input type="text" class="form-control subtotal" readonly placeholder="Subtotal" data-index="${index}">
            </div>
            <div class="col-md-1">
                <button type="button" class="btn btn-danger btn-sm" onclick="removerItemCompra(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    $('#itensCompra').append(itemHtml);
    calcularTotalCompra();
}

// Update item price
function atualizarPrecoItem(index) {
    const select = $(`.produto-select[data-index="${index}"]`);
    const selectedOption = select.find('option:selected');
    const preco = selectedOption.data('preco') || 0;
    
    $(`.preco[data-index="${index}"]`).val(preco);
    calcularSubtotalItem(index);
}

// Calculate item subtotal
function calcularSubtotalItem(index) {
    const quantidade = parseFloat($(`.quantidade[data-index="${index}"]`).val()) || 0;
    const preco = parseFloat($(`.preco[data-index="${index}"]`).val()) || 0;
    const subtotal = quantidade * preco;
    
    $(`.subtotal[data-index="${index}"]`).val(formatCurrency(subtotal));
    calcularTotalCompra();
}

// Calculate total
function calcularTotalCompra() {
    let total = 0;
    $('.subtotal').each(function() {
        const valor = parseFloat($(this).val().replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0;
        total += valor;
    });
    $('#totalCompra').text(formatCurrency(total));
}

// Remove item
function removerItemCompra(index) {
    $(`.item-compra[data-index="${index}"]`).remove();
    calcularTotalCompra();
}

// Save compra
function saveCompra() {
    const itens = [];
    let hasError = false;
    
    $('.item-compra').each(function() {
        const produtoId = $(this).find('.produto-select').val();
        const quantidade = parseFloat($(this).find('.quantidade').val());
        const precoUnitario = parseFloat($(this).find('.preco').val());
        
        if (!produtoId || !quantidade || !precoUnitario) {
            hasError = true;
            return;
        }
        
        itens.push({
            produto_id: parseInt(produtoId),
            quantidade: quantidade,
            preco_unitario: precoUnitario,
            subtotal: quantidade * precoUnitario
        });
    });
    
    if (hasError || itens.length === 0) {
        showNotification('Preencha todos os itens corretamente!', 'danger');
        return;
    }
    
    const data = {
        nota_fiscal: $('#nota_fiscal').val(),
        data_compra: $('#data_compra').val(),
        fornecedor: $('#fornecedor').val(),
        total: parseFloat($('#totalCompra').text().replace('R$', '').replace('.', '').replace(',', '.').trim()),
        itens: itens
    };
    
    const url = `${API_URL}/compras`;
    const method = 'POST';
    
    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function() {
            $('#compraModal').modal('hide');
            showNotification('Compra registrada com sucesso!');
            loadCompras();
        },
        error: function(xhr) {
            showNotification('Erro ao registrar compra: ' + (xhr.responseJSON?.error || 'Erro desconhecido'), 'danger');
        }
    });
}

// View compra
function viewCompra(id) {
    $.ajax({
        url: `${API_URL}/compras/${id}`,
        method: 'GET',
        success: function(compra) {
            const modalHtml = `
                <div class="modal fade" id="viewCompraModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalhes da Compra</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p><strong>Nota Fiscal:</strong> ${compra.nota_fiscal || '-'}</p>
                                <p><strong>Data da Compra:</strong> ${formatDate(compra.data_compra)}</p>
                                <p><strong>Fornecedor:</strong> ${compra.fornecedor || '-'}</p>
                                <p><strong>Total:</strong> ${formatCurrency(compra.total)}</p>
                                <p><strong>Status:</strong> ${compra.status}</p>
                                
                                <hr>
                                <h6>Itens da Compra</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Produto</th>
                                                <th>Quantidade</th>
                                                <th>Preço Unitário</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${compra.itens.map(item => `
                                                <tr>
                                                    <td>${item.produto_nome}</td>
                                                    <td>${item.quantidade}</td>
                                                    <td>${formatCurrency(item.preco_unitario)}</td>
                                                    <td>${formatCurrency(item.subtotal)}</td>
                                                </tr>
                                            `).join('')}
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
            $('#viewCompraModal').modal('show');
        }
    });
}

// Delete compra
function deleteCompra(id) {
    if (confirm('Tem certeza que deseja excluir esta compra? Isso irá ajustar o estoque dos produtos.')) {
        $.ajax({
            url: `${API_URL}/compras/${id}`,
            method: 'DELETE',
            success: function() {
                showNotification('Compra excluída com sucesso!');
                loadCompras();
            },
            error: function(xhr) {
                showNotification('Erro ao excluir compra: ' + (xhr.responseJSON?.error || 'Erro desconhecido'), 'danger');
            }
        });
    }
}