
const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todos os produtos
router.get('/', (req, res) => {
  db.all('SELECT * FROM produtos ORDER BY nome', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Buscar produto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM produtos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Buscar produto por código
router.get('/codigo/:codigo', (req, res) => {
  const { codigo } = req.params;
  db.get('SELECT * FROM produtos WHERE codigo = ?', [codigo], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Histórico de preços do produto
router.get('/:id/historico-precos', (req, res) => {
  const { id } = req.params;
  db.all(`
    SELECT * FROM produtos_preco_historico
    WHERE produto_id = ?
    ORDER BY created_at DESC
  `, [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Criar produto
router.post('/', (req, res) => {
  const {
    codigo, nome, categoria, unidade, preco_compra,
    preco_venda, estoque_atual, estoque_minimo, fornecedor
  } = req.body;

  db.run(`
    INSERT INTO produtos (codigo, nome, categoria, unidade, preco_compra, preco_venda, estoque_atual, estoque_minimo, fornecedor)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [codigo, nome, categoria, unidade, preco_compra, preco_venda, estoque_atual || 0, estoque_minimo || 0, fornecedor],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Produto criado com sucesso' });
    });
});

// Atualizar produto
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  db.get('SELECT * FROM produtos WHERE id = ?', [id], (err, old) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!old) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const fields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    values.push(id);

    db.run(`
      UPDATE produtos
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values, function(updateErr) {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }

      const novoPc = updates.preco_compra !== undefined ? updates.preco_compra : old.preco_compra;
      const novoPv = updates.preco_venda !== undefined ? updates.preco_venda : old.preco_venda;
      const mudouCompra = Number(novoPc) !== Number(old.preco_compra);
      const mudouVenda = Number(novoPv) !== Number(old.preco_venda);

      if (mudouCompra || mudouVenda) {
        db.run(`
          INSERT INTO produtos_preco_historico (
            produto_id, preco_compra_anterior, preco_compra_novo, preco_venda_anterior, preco_venda_novo
          ) VALUES (?, ?, ?, ?, ?)
        `, [id, old.preco_compra, novoPc, old.preco_venda, novoPv], (histErr) => {
          if (histErr) {
            console.error('Erro ao registrar histórico de preços:', histErr);
          }
          res.json({ message: 'Produto atualizado com sucesso' });
        });
      } else {
        res.json({ message: 'Produto atualizado com sucesso' });
      }
    });
  });
});

// Deletar produto
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM produtos WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Produto deletado com sucesso' });
  });
});

// Buscar produtos com estoque baixo
router.get('/estoque/baixo', (req, res) => {
  db.all(`
    SELECT * FROM produtos 
    WHERE estoque_atual <= estoque_minimo 
    ORDER BY (estoque_atual / NULLIF(estoque_minimo, 0)) ASC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

module.exports = router;