const express = require('express');
const router = express.Router();
const db = require('../database');

// Listar todas as configurações
router.get('/', (req, res) => {
  db.all('SELECT * FROM configuracoes ORDER BY chave', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Buscar configuração por chave
router.get('/:chave', (req, res) => {
  const { chave } = req.params;
  db.get('SELECT * FROM configuracoes WHERE chave = ?', [chave], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// Atualizar configuração
router.put('/:chave', (req, res) => {
  const { chave } = req.params;
  const { valor } = req.body;
  
  db.run(`
    UPDATE configuracoes 
    SET valor = ?, updated_at = CURRENT_TIMESTAMP
    WHERE chave = ?
  `, [valor, chave],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Configuração atualizada com sucesso' });
    });
});

// Criar nova configuração
router.post('/', (req, res) => {
  const { chave, valor, tipo, descricao } = req.body;
  
  db.run(`
    INSERT INTO configuracoes (chave, valor, tipo, descricao)
    VALUES (?, ?, ?, ?)
  `, [chave, valor, tipo, descricao],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Configuração criada com sucesso' });
    });
});

module.exports = router;