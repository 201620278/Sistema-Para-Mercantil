let categoriasSistema = [];
let produtosSistema = [];

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarProdutos();
});

async function inicializarProdutos() {
    try {
        await carregarCategorias();
        await carregarProdutos();
        configurarEventos();
    } catch (erro) {
        console.error('Erro ao inicializar módulo de produtos:', erro);
    }
}

function configurarEventos() {
    const form = document.getElementById('formProduto');
    if (form) {
        form.addEventListener('submit', salvarProduto);
    }

    const selectCategoria = document.getElementById('produtoCategoria');
    if (selectCategoria) {
        selectCategoria.addEventListener('change', preencherSubcategorias);
    }
}
async function carregarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const dados = await response.json();

        categoriasSistema = (dados || []).map(cat => ({
            ...cat,
            id: String(cat.id),
            nome: cat.nome || cat.categoria || '',
            subcategorias: (cat.subcategorias || cat.subCategorias || []).map(sub => ({
                ...sub,
                id: String(sub.id),
                nome: sub.nome || sub.subcategoria || ''
            }))
        }));

        preencherSelectCategorias();
    } catch (erro) {
        console.error('Erro ao carregar categorias:', erro);
        categoriasSistema = [];
    }
}

function preencherSelectCategorias() {
    const selectCategoria = document.getElementById('produtoCategoria');
    if (!selectCategoria) return;

    selectCategoria.innerHTML = `<option value="">Selecione</option>`;

    categoriasSistema.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        selectCategoria.appendChild(option);
    });
}

function preencherSubcategorias(subcategoriaSelecionada = '') {
    const selectCategoria = document.getElementById('produtoCategoria');
    const selectSubcategoria = document.getElementById('produtoSubcategoria');

    if (!selectCategoria || !selectSubcategoria) return;

    const categoriaId = String(selectCategoria.value || '');
    const categoria = categoriasSistema.find(c => String(c.id) === categoriaId);

    selectSubcategoria.innerHTML = `<option value="">Selecione</option>`;

    if (!categoria) return;

    (categoria.subcategorias || []).forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.id;
        option.textContent = sub.nome;
        if (String(sub.id) === String(subcategoriaSelecionada)) {
            option.selected = true;
        }
        selectSubcategoria.appendChild(option);
    });
}

function obterCategoriaNome(produto) {
    const categoriaId = String(
        produto.categoriaId ??
        produto.categoria_id ??
        produto.idCategoria ??
        produto.id_categoria ??
        ''
    );
    if (!categoriaId) return '-';
    const categoria = categoriasSistema.find(c => String(c.id) === categoriaId);
    return categoria?.nome || '-';
}

function obterSubcategoriaNome(produto) {
    const categoriaId = String(
        produto.categoriaId ??
        produto.categoria_id ??
        produto.idCategoria ??
        produto.id_categoria ??
        ''
    );
    const subcategoriaId = String(
        produto.subcategoriaId ??
        produto.subcategoria_id ??
        produto.idSubcategoria ??
        produto.id_subcategoria ??
        ''
    );
    if (!categoriaId || !subcategoriaId) return '-';
    const categoria = categoriasSistema.find(c => String(c.id) === categoriaId);
    if (!categoria) return '-';
    const subcategoria = (categoria.subcategorias || []).find(
        sub => String(sub.id) === subcategoriaId
    );
    return subcategoria?.nome || '-';
}
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        const dados = await response.json();
        produtosSistema = dados || [];
        renderizarTabelaProdutos(produtosSistema);
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
        produtosSistema = [];
    }
}
function renderizarTabelaProdutos(produtos) {
    const tbody = document.getElementById('tabelaProdutosBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    produtos.forEach(produto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${produto.nome || '-'}</td>
            <td>${produto.codigo || '-'}</td>
            <td>${obterCategoriaNome(produto)}</td>
            <td>${obterSubcategoriaNome(produto)}</td>
            <td>${Number(produto.preco || 0).toFixed(2)}</td>
            <td>${produto.estoque ?? 0}</td>
            <td>
                <button onclick="editarProduto('${produto.id}')">Editar</button>
                <button onclick="excluirProduto('${produto.id}')">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
// Função utilitária para normalizar produto com categoria e subcategoria
function normalizarProduto(produto, categorias = window.categoriasSistema || []) {
    const categoriaId = String(produto.categoria_id || produto.categoriaId || '');
    const subcategoriaId = String(produto.subcategoria_id || produto.subcategoriaId || '');
    const categoriaObj = categorias.find(c => String(c.id) === categoriaId);
    const subcategoriaObj = categoriaObj && categoriaObj.subcategorias ? categoriaObj.subcategorias.find(s => String(s.id) === subcategoriaId) : null;
    return {
        ...produto,
        categoria: produto.categoria || (categoriaObj ? categoriaObj.nome : ''),
        subcategoria: produto.subcategoria || (subcategoriaObj ? subcategoriaObj.nome : '')
    };
}
// Função global para minimizar modais Bootstrap
window.minimizarModal = function(modalId) {
    const $modal = $('#' + modalId);
    if ($modal.length) {
        $modal.modal('hide');
        // Adiciona botão flutuante para restaurar
        if ($('#btn-restaurar-' + modalId).length === 0) {
            const $btn = $('<button id="btn-restaurar-' + modalId + '" class="btn btn-primary position-fixed" style="bottom: 24px; right: 24px; z-index: 2000; box-shadow: 0 2px 8px #0002;">Restaurar Produto</button>');
            $btn.on('click', function() {
                $modal.modal('show');
                // Atualiza categorias e subcategorias ao restaurar
                if (typeof inicializarCategoriasESubcategorias === 'function') {
                    // Pega os dados já preenchidos
                    const produto = {
                        id: $('#produtoId').val(),
                        codigo: $('#codigo').val(),
                        nome: $('#nome').val(),
                        categoria_id: $('#categoria_id').val(),
                        subcategoria_id: $('#subcategoria_id').val(),
                        unidade: $('#unidade').val(),
                        preco_compra: $('#preco_compra').val(),
                        lucro_percentual: $('#lucro_percentual').val(),
                        preco_venda: $('#preco_venda').val(),
                        estoque_atual: $('#estoque_atual').val(),
                        estoque_minimo: $('#estoque_minimo').val(),
                        fornecedor: $('#fornecedor').val()
                    };
                    inicializarCategoriasESubcategorias(produto, !!produto.id);
                }
                $(this).remove();
            });
            $('body').append($btn);
        }
    }
};
// =========================
// MÓDULO DE PRODUTOS
// =========================

// Carrega página de produtos
function loadProdutos() {
    $.ajax({
        url: `${API_URL}/produtos`,
        method: 'GET',
        success: function (produtos) {
            renderProdutos(produtos || []);
        },
        error: function () {
            $('#page-content').html('<div class="alert alert-danger">Erro ao carregar produtos!</div>');
        }
    });
}
window.loadProdutos = loadProdutos;


// Renderiza listagem de produtos
function renderProdutos(produtos) {
    const html = `
        <div class="card">
            <div class="card-header">
                <div class="row align-items-center">
                    <div class="col-md-6">
                        <i class="fas fa-box"></i> Lista de Produtos
                    </div>
                    <div class="col-md-6 text-end">
                        <input
                            type="text"
                            class="form-control form-control-sm d-inline-block w-auto me-2"
                            id="buscaProduto"
                            placeholder="Buscar produto..."
                        >
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
                                <th>Nome</th>
                                <th>Código</th>
                                <th>Categoria</th>
                                <th>Unidade</th>
                                <th>Preço Compra</th>
                                <th>Preço Venda</th>
                                <th>Estoque</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody id="produtos-tbody">
                            ${renderProdutosRows(produtos)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    $('#page-content').html(html);

    $('#buscaProduto').on('input', function () {
        const termo = ($(this).val() || '').toLowerCase().trim();

        const filtrados = produtos.filter(p =>
            (p.nome && String(p.nome).toLowerCase().includes(termo)) ||
            (p.codigo && String(p.codigo).toLowerCase().includes(termo)) ||
            (p.categoria && String(p.categoria).toLowerCase().includes(termo)) ||
            (p.fornecedor && String(p.fornecedor).toLowerCase().includes(termo))
        );

        $('#produtos-tbody').html(renderProdutosRows(filtrados));
    });
}

function renderProdutosRows(produtos) {
    if (!produtos || produtos.length === 0) {
        return '<tr><td colspan="8" class="text-center">Nenhum produto cadastrado</td></tr>';
    }

    return produtos.map(p => `
        <tr>
            <td>${escapeHtml(p.nome || '')}</td>
            <td>${escapeHtml(p.codigo || '-')}</td>
            <td>${escapeHtml(p.categoria || '-')}</td>
            <td>${escapeHtml(p.unidade || '-')}</td>
            <td>${formatCurrency(Number(p.preco_compra || 0))}</td>
            <td>${formatCurrency(Number(p.preco_venda || 0))}</td>
            <td>${Number(p.estoque_atual || 0)}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewProduto(${p.id})" title="Detalhes">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editProduto(${p.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduto(${p.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn btn-sm btn-secondary" onclick="showHistoricoPrecos(${p.id})" title="Histórico de preços">
                    <i class="fas fa-history"></i>
                </button>
            </td>
        </tr>
    `).join('');
}


// Abre modal de produto
function showProdutoModal(produto = null) {
    const isEdit = produto !== null;
    const title = isEdit ? 'Editar Produto' : 'Novo Produto';
    const lucro = isEdit && produto.lucro_percentual !== undefined ? produto.lucro_percentual : '';

    const modalHtml = `
        <div class="modal fade" id="produtoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header d-flex align-items-center justify-content-between">
                        <h5 class="modal-title mb-0">${title}</h5>
                        <div>
                            <button type="button" class="btn btn-sm btn-light me-1" title="Minimizar" onclick="minimizarModal('produtoModal')">
                                <i class="fas fa-window-minimize"></i>
						</button>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
					</div>
				</div>

                    <div class="modal-body">
                        <form id="produtoForm">
                            <input type="hidden" id="produtoId" value="${isEdit ? (produto.id || '') : ''}">

                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="codigo" class="form-label">Código</label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        id="codigo"
                                        value="${isEdit ? escapeHtml(produto.codigo || '') : ''}"
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="nome" class="form-label">Nome *</label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        id="nome"
                                        required
                                        value="${isEdit ? escapeHtml(produto.nome || '') : ''}"
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="categoria_id" class="form-label">Categoria</label>
                                    <select class="form-control" id="categoria_id">
                                        <option value="">Carregando...</option>
                                    </select>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="subcategoria_id" class="form-label">Subcategoria</label>
                                    <select class="form-control" id="subcategoria_id">
                                        <option value="">Selecione uma categoria</option>
                                    </select>
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
                                    <input
                                        type="number"
                                        step="0.01"
                                        class="form-control"
                                        id="preco_compra"
                                        value="${isEdit ? Number(produto.preco_compra || 0) : 0}"
                                    >
                                </div>

                                <div class="col-md-4 mb-3">
                                    <label for="lucro_percentual" class="form-label">% Lucro Real</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        class="form-control"
                                        id="lucro_percentual"
                                        placeholder="%"
                                        value="${lucro}"
                                    >
                                </div>

                                <div class="col-md-4 mb-3">
                                    <label for="preco_venda" class="form-label">Preço de Venda *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        class="form-control"
                                        id="preco_venda"
                                        required
                                        value="${isEdit ? Number(produto.preco_venda || 0) : 0}"
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="estoque_atual" class="form-label">Estoque Atual</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        class="form-control"
                                        id="estoque_atual"
                                        value="${isEdit ? Number(produto.estoque_atual || 0) : 0}"
                                    >
                                </div>

                                <div class="col-md-6 mb-3">
                                    <label for="estoque_minimo" class="form-label">Estoque Mínimo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        class="form-control"
                                        id="estoque_minimo"
                                        value="${isEdit ? Number(produto.estoque_minimo || 0) : 0}"
                                    >
                                </div>

                                <div class="col-md-12 mb-3 position-relative">
                                    <label for="fornecedor" class="form-label">Fornecedor</label>
                                    <input
                                        type="text"
                                        class="form-control"
                                        id="fornecedor"
                                        autocomplete="off"
                                        value="${isEdit ? escapeHtml(produto.fornecedor || '') : ''}"
                                    >
                                    <div
                                        id="fornecedor-autocomplete"
                                        class="list-group position-absolute w-100"
                                        style="z-index: 9999; display: none;"
                                    ></div>
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

    inicializarCategoriasESubcategorias(produto, isEdit);
    inicializarAutocompleteFornecedor();
    inicializarCalculoPreco(produto, isEdit);

    $('#produtoModal').modal('show');
    // Remove botão flutuante se existir ao restaurar
    $('#btn-restaurar-produtoModal').remove();

    // ...
}


// Inicializa categorias e subcategorias
function inicializarCategoriasESubcategorias(produto, isEdit) {
    if (!(window.categoriasAPI && window.subcategoriasAPI)) {
        $('#categoria_id').html('<option value="">Categorias indisponíveis</option>');
        $('#subcategoria_id').html('<option value="">Subcategorias indisponíveis</option>');
        return;
    }

    categoriasAPI.listar().done(function (categorias) {
        let catOptions = '<option value="">Selecione</option>';

        (categorias || []).forEach(cat => {
            catOptions += `<option value="${cat.id}">${escapeHtml(cat.nome || '')}</option>`;
        });

        $('#categoria_id').html(catOptions);

        if (isEdit && produto && produto.categoria_id) {
            $('#categoria_id').val(String(produto.categoria_id));
        }

        function carregarSubs(catId, selectedSubId = '') {
            if (!catId) {
                $('#subcategoria_id').html('<option value="">Selecione uma categoria</option>');
                return;
            }

            subcategoriasAPI.listarPorCategoria(catId).done(function (subcats) {
                let subOptions = '<option value="">Nenhuma</option>';

                (subcats || []).forEach(sub => {
                    subOptions += `<option value="${sub.id}">${escapeHtml(sub.nome || '')}</option>`;
                });

                $('#subcategoria_id').html(subOptions);

                if (selectedSubId) {
                    $('#subcategoria_id').val(String(selectedSubId));
                }
            }).fail(function () {
                $('#subcategoria_id').html('<option value="">Erro ao carregar subcategorias</option>');
            });
        }

        $('#categoria_id').off('change').on('change', function () {
            carregarSubs($(this).val());
        });

        if (isEdit && produto && produto.categoria_id) {
            carregarSubs(produto.categoria_id, produto.subcategoria_id || '');
        } else {
            $('#subcategoria_id').html('<option value="">Selecione uma categoria</option>');
        }
    }).fail(function () {
        $('#categoria_id').html('<option value="">Erro ao carregar categorias</option>');
        $('#subcategoria_id').html('<option value="">Erro ao carregar subcategorias</option>');
    });
}


// Inicializa autocomplete de fornecedor
function inicializarAutocompleteFornecedor() {
    $('#fornecedor').off('input').on('input', function () {
        const termo = ($(this).val() || '').trim();
        const $lista = $('#fornecedor-autocomplete');

        if (termo.length < 2) {
            $lista.hide().html('');
            return;
        }

        $.ajax({
            url: `${API_URL}/fornecedores`,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
            },
            success: function (fornecedores) {
                const filtrados = (fornecedores || []).filter(f =>
                    f &&
                    f.nome &&
                    String(f.nome).toLowerCase().includes(termo.toLowerCase())
                );

                if (filtrados.length === 0) {
                    $lista.hide().html('');
                    return;
                }

                let html = '';
                filtrados.forEach(f => {
                    html += `
                        <button
                            type="button"
                            class="list-group-item list-group-item-action fornecedor-item"
                            data-nome="${escapeHtml(f.nome)}"
                        >
                            ${escapeHtml(f.nome)}
                        </button>
                    `;
                });

                $lista.html(html).show();

                $('.fornecedor-item').off('click').on('click', function () {
                    $('#fornecedor').val($(this).text().trim());
                    $lista.hide().html('');
                });
            },
            error: function () {
                $lista.hide().html('');
            }
        });
    });

    $('#fornecedor').off('blur').on('blur', function () {
        setTimeout(() => {
            $('#fornecedor-autocomplete').hide().html('');
        }, 200);
    });
}


// Inicializa cálculo automático do preço de venda
function inicializarCalculoPreco(produto, isEdit) {
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

    $('#preco_compra').off('input').on('input', atualizarPrecoVenda);
    $('#lucro_percentual').off('input').on('input', atualizarPrecoVenda);

    if (isEdit && produto) {
        setTimeout(atualizarPrecoVenda, 100);
    }
}


// Salva produto
function saveProduto() {
    const id = $('#produtoId').val();

    const data = {
        codigo: ($('#codigo').val() || '').trim(),
        nome: ($('#nome').val() || '').trim(),
        categoria_id: $('#categoria_id').val() || null,
        subcategoria_id: $('#subcategoria_id').val() || null,
        unidade: ($('#unidade').val() || '').trim(),
        preco_compra: parseFloat($('#preco_compra').val()) || 0,
        preco_venda: parseFloat($('#preco_venda').val()) || 0,
        lucro_percentual: $('#lucro_percentual').val() !== '' ? parseFloat($('#lucro_percentual').val()) : null,
        estoque_atual: parseFloat($('#estoque_atual').val()) || 0,
        estoque_minimo: parseFloat($('#estoque_minimo').val()) || 0,
        fornecedor: ($('#fornecedor').val() || '').trim()
    };

    if (!data.nome) {
        showNotification('Informe o nome do produto.', 'warning');
        $('#nome').focus();
        return;
    }

    if (data.preco_venda <= 0) {
        showNotification('Informe um preço de venda válido.', 'warning');
        $('#preco_venda').focus();
        return;
    }

    const url = id ? `${API_URL}/produtos/${id}` : `${API_URL}/produtos`;
    const method = id ? 'PUT' : 'POST';

    $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
        },
        data: JSON.stringify(data),
        success: function (produtoSalvo) {
            $('#produtoModal').modal('hide');
            showNotification('Produto salvo com sucesso!', 'success');
            // Atualiza lista local se necessário
            if (window.listaProdutos && Array.isArray(window.listaProdutos)) {
                const produtoNormalizado = normalizarProduto(produtoSalvo, window.categoriasSistema || []);
                window.listaProdutos.unshift(produtoNormalizado);
                if (typeof renderProdutos === 'function') {
                    renderProdutos(window.listaProdutos);
                }
            } else {
                loadProdutos();
            }
        },
        error: function (xhr) {
            const erro = xhr.responseJSON?.error || 'Erro desconhecido';
            showNotification('Erro ao salvar produto: ' + erro, 'danger');
        }
    });
}
window.saveProduto = saveProduto;


// Histórico de preços
function showHistoricoPrecos(produtoId) {
    $.ajax({
        url: `${API_URL}/produtos/${produtoId}/historico-precos`,
        method: 'GET',
        success: function (rows) {
            const modalHtml = `
                <div class="modal fade" id="historicoPrecosModal" tabindex="-1" aria-hidden="true">
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
                                            ${(rows && rows.length)
                                                ? rows.map(r => `
                                                    <tr>
                                                        <td>${formatDateTime(r.created_at)}</td>
                                                        <td>${formatCurrency(r.preco_compra_anterior || 0)} → ${formatCurrency(r.preco_compra_novo || 0)}</td>
                                                        <td>${formatCurrency(r.preco_venda_anterior || 0)} → ${formatCurrency(r.preco_venda_novo || 0)}</td>
                                                    </tr>
                                                `).join('')
                                                : '<tr><td colspan="3" class="text-center">Nenhuma alteração de preço registrada ainda.</td></tr>'
                                            }
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
        error: function () {
            showNotification('Erro ao carregar histórico de preços.', 'danger');
        }
    });
}
window.showHistoricoPrecos = showHistoricoPrecos;


// Excluir produto
function deleteProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }

    $.ajax({
        url: `${API_URL}/produtos/${id}`,
        method: 'DELETE',
        headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
        },
        success: function () {
            showNotification('Produto excluído com sucesso!', 'success');
            loadProdutos();
        },
        error: function (xhr) {
            const erro = xhr.responseJSON?.error || 'Erro desconhecido';
            showNotification('Erro ao excluir produto: ' + erro, 'danger');
        }
    });
}
window.deleteProduto = deleteProduto;


// Editar produto
function editProduto(id) {
    $.ajax({
        url: `${API_URL}/produtos/${id}`,
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
        },
        success: function (produto) {
            showProdutoModal(produto);
        },
        error: function () {
            showNotification('Erro ao carregar produto para edição.', 'danger');
        }
    });
}
window.editProduto = editProduto;


// Visualizar produto
function viewProduto(id) {
    $.ajax({
        url: `${API_URL}/produtos/${id}`,
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + (localStorage.getItem('token') || '')
        },
        success: function (produto) {
            const modalHtml = `
                <div class="modal fade" id="viewProdutoModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalhes do Produto</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p><strong>Nome:</strong> ${escapeHtml(produto.nome || '-')}</p>
                                <p><strong>Código:</strong> ${escapeHtml(produto.codigo || '-')}</p>
                                <p><strong>Categoria:</strong> ${escapeHtml(produto.categoria || '-')}</p>
                                <p><strong>Subcategoria:</strong> ${escapeHtml(produto.subcategoria || '-')}</p>
                                <p><strong>Unidade:</strong> ${escapeHtml(produto.unidade || '-')}</p>
                                <p><strong>Preço de Compra:</strong> ${formatCurrency(produto.preco_compra || 0)}</p>
                                <p><strong>Preço de Venda:</strong> ${formatCurrency(produto.preco_venda || 0)}</p>
                                <p><strong>Estoque Atual:</strong> ${Number(produto.estoque_atual || 0)}</p>
                                <p><strong>Estoque Mínimo:</strong> ${Number(produto.estoque_minimo || 0)}</p>
                                <p><strong>Fornecedor:</strong> ${escapeHtml(produto.fornecedor || '-')}</p>
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
        },
        error: function () {
            showNotification('Erro ao carregar detalhes do produto.', 'danger');
        }
    });
}
window.viewProduto = viewProduto;


// Escape HTML
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}