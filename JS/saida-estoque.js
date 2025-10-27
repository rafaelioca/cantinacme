// Lógica do modal de Saída de Estoque
$(document).ready(function() {
  let db;
  (async () => {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const firebaseConfig = {
      apiKey: "AIzaSyCUW87ZznZ8MotN5iYwRatI90QfW5kCfSQ",
      authDomain: "quitandas-cme.firebaseapp.com",
      projectId: "quitandas-cme",
      storageBucket: "quitandas-cme.firebasestorage.app",
      messagingSenderId: "247363809064",
      appId: "1:247363809064:web:377dec56b8348f0ea36a1d",
      measurementId: "G-EE0ZT2MG1M"
    };
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
      // Habilita o botão Salvar após inicialização
      $('#btnSalvarSaidaEstoque').prop('disabled', false);
  })();
    // Desabilita o botão Salvar até o Firebase estar pronto
    $('#btnSalvarSaidaEstoque').prop('disabled', true);
  // Abrir modal
  $('.btn-saida').on('click', function() {
    $('#formSaidaEstoque')[0].reset();
    $('.produtos-saida-estoque-lista').empty();
    $('#modalSaidaEstoqueBg').fadeIn(200);
  });
  // Fechar modal
  $('#btnFecharModalSaidaEstoque').on('click', function() {
    $('#modalSaidaEstoqueBg').fadeOut(200);
  });
  // Busca de produtos para saída
  function getProdutosCadastrados() {
    var lista = [];
    $('.card-produto-geral .nome').each(function() {
      lista.push($(this).text());
    });
    return lista.length ? lista : ["Coca-Cola", "Schweppes", "Guaraná", "Água"];
  }
  $('.busca-produto-saida-estoque').on('input', function() {
    var val = $(this).val().toLowerCase();
    if (!db) {
      $('.sugestoes-produto-saida-estoque').html('<div style="padding:8px;color:#e91e63;">Aguarde, carregando produtos...</div>').show();
      return;
    }
    // Busca produtos do Firebase
    (async () => {
      const { getDocs, collection } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const snapshot = await getDocs(collection(db, 'produtos'));
      var produtosCadastrados = [];
      snapshot.forEach(docSnap => {
        const prod = docSnap.data();
        if (prod.nome) produtosCadastrados.push(prod.nome);
      });
      var sugestoes = produtosCadastrados.filter(function(p) { return p.toLowerCase().includes(val); });
      var html = sugestoes.map(function(p) {
        return `<div class=\"sugestao-produto-saida\">${p}</div>`;
      }).join('');
      $('.sugestoes-produto-saida-estoque').html(html).show();
    })();
  });
  $(document).on('click', '.sugestao-produto-saida', function() {
    var nome = $(this).text();
    var itemHtml = `<div class=\"produto-saida-estoque-item\" style=\"display:flex;gap:8px;align-items:center;margin-bottom:8px;\">\n  <input type=\"text\" class=\"nome-produto-saida-estoque\" value=\"${nome}\" readonly style=\"width:120px;\">\n  <input type=\"number\" class=\"qtd-produto-saida-estoque\" min=\"1\" value=\"1\" style=\"width:60px;\">\n  <button type=\"button\" class=\"remover-produto-saida-estoque\" style=\"background:#e91e63;color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:16px;cursor:pointer;\">×</button>\n</div>`;
    $('.produtos-saida-estoque-lista').append(itemHtml);
    $('.sugestoes-produto-saida-estoque').hide();
    $('.busca-produto-saida-estoque').val('');
  });
  $(document).on('click', '.remover-produto-saida-estoque', function() {
    $(this).closest('.produto-saida-estoque-item').remove();
  });

  // Salvar saída
  $('#formSaidaEstoque').on('submit', function(e) {
    var cardEditando = $(this).data('cardEditando');
    e.preventDefault();
    if (!db) {
      alert('Aguarde, o sistema está inicializando o Firebase. Tente novamente em instantes.');
      return;
    }
    var data = $('#dataSaidaEstoque').val();
    var motivo = $('#motivoSaidaEstoque').val();
    var produtos = [];
    $('.produtos-saida-estoque-lista .produto-saida-estoque-item').each(function() {
      var nome = $(this).find('.nome-produto-saida-estoque').val();
      var qtd = $(this).find('.qtd-produto-saida-estoque').val();
      produtos.push({ nome, qtd });
    });
    // Se estiver editando, atualiza o documento existente
    (async () => {
      try {
        const { addDoc, collection, getDocs, query, where, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        // Formata data para dd-mm-aaaa
        function formatarDataBR(data) {
          if (data && data.match(/^\d{4}-\d{2}-\d{2}$/)) {
            let partes = data.split('-');
            return `${partes[2]}-${partes[1]}-${partes[0]}`;
          }
          if (data && data.match(/^\d{2}-\d{2}-\d{4}$/)) {
            return data;
          }
          return data || '';
        }
        var dataFormatada = formatarDataBR(data);
        if (cardEditando) {
          // Busca o documento pelo data e motivo antigos
          const saidaRef = collection(db, 'saida de estoque');
          const q = query(saidaRef,
            where('data', '==', cardEditando.attr('data-data')),
            where('motivo', '==', cardEditando.attr('data-local'))
          );
          const snap = await getDocs(q);
          let docId = null;
          let produtosAntigos = JSON.parse(cardEditando.attr('data-produtos'));
          snap.forEach((docSnap) => {
            // Compara produtos por nome e quantidade, ignorando ordem
            const prodDb = docSnap.data().produtos;
            if (prodDb.length === produtosAntigos.length) {
              let iguais = prodDb.every((pDb) => {
                return produtosAntigos.some((pAnt) => pAnt.nome === pDb.nome && String(pAnt.qtd) === String(pDb.qtd));
              });
              if (iguais) {
                docId = docSnap.id;
              }
            }
          });
          if (docId) {
            // Atualiza o documento
            const { doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const docRef = doc(db, 'saida de estoque', docId);
            await updateDoc(docRef, {
              data: dataFormatada,
              motivo,
              produtos
            });
            // Atualiza estoque dos produtos: devolve quantidade antiga e subtrai nova
            let produtosAntigos = JSON.parse(cardEditando.attr('data-produtos'));
            for (const pNovo of produtos) {
              // Procura o produto antigo correspondente
              const pAntigo = produtosAntigos.find(p => p.nome === pNovo.nome);
              const produtosRef = collection(db, 'produtos');
              const q = query(produtosRef, where('nome', '==', pNovo.nome));
              const snap = await getDocs(q);
              snap.forEach(async (docSnap) => {
                const prodData = docSnap.data();
                let estoqueAtual = prodData.estoque || 0;
                let qtdAntiga = pAntigo ? parseInt(pAntigo.qtd) || 0 : 0;
                let qtdNova = parseInt(pNovo.qtd) || 0;
                let novoEstoque = estoqueAtual + qtdAntiga - qtdNova;
                await updateDoc(docSnap.ref, { estoque: novoEstoque });
              });
            }
            // Se algum produto foi removido na edição, devolve o estoque desses produtos
            for (const pAntigo of produtosAntigos) {
              const existeNovo = produtos.some(p => p.nome === pAntigo.nome);
              if (!existeNovo) {
                const produtosRef = collection(db, 'produtos');
                const q = query(produtosRef, where('nome', '==', pAntigo.nome));
                const snap = await getDocs(q);
                snap.forEach(async (docSnap) => {
                  const prodData = docSnap.data();
                  let estoqueAtual = prodData.estoque || 0;
                  let qtdAntiga = parseInt(pAntigo.qtd) || 0;
                  let novoEstoque = estoqueAtual + qtdAntiga;
                  await updateDoc(docSnap.ref, { estoque: novoEstoque });
                });
              }
            }
            // Atualiza card na página
            cardEditando.attr('data-produtos', JSON.stringify(produtos));
            cardEditando.attr('data-data', dataFormatada);
            cardEditando.attr('data-local', motivo);
            cardEditando.find('.data-compra').text(dataFormatada);
            cardEditando.find('.local-compra').text(motivo);
            $('#modalSaidaEstoqueBg').fadeOut(200);
            document.getElementById('formSaidaEstoque').reset();
            $('.produtos-saida-estoque-lista').empty();
            return;
          }
        }
        // Se não estiver editando, cria novo
        await addDoc(collection(db, 'saida de estoque'), {
          data: dataFormatada,
          motivo,
          produtos
        });
        // Ajusta estoque dos produtos no Firestore
        for (const p of produtos) {
          const produtosRef = collection(db, 'produtos');
          const q = query(produtosRef, where('nome', '==', p.nome));
          const snap = await getDocs(q);
          snap.forEach(async (docSnap) => {
            const prodData = docSnap.data();
            let novoEstoque = (prodData.estoque || 0) - (parseInt(p.qtd) || 0);
            if (novoEstoque < 0) novoEstoque = 0;
            await updateDoc(docSnap.ref, { estoque: novoEstoque });
          });
        }
        // Insere card na página de estoque
        var novoCard = `<div class=\"card-estoque\" data-produtos='${JSON.stringify(produtos)}' data-data='${dataFormatada}' data-local='${motivo}' data-valor='' data-tipo='saida'>\n      <span class=\"data-compra\">${dataFormatada}</span>\n      <span class=\"local-compra\">${motivo}</span>\n      <span class=\"valor-compra\"><span style=\"color:#e91e63;font-weight:bold;margin-left:12px;\">Saída</span></span>\n    </div>`;
        $('.lista-estoque').append(novoCard);
        $('#modalSaidaEstoqueBg').fadeOut(200);
        document.getElementById('formSaidaEstoque').reset();
        $('.produtos-saida-estoque-lista').empty();
      } catch (err) {
        alert('Erro ao salvar saída ou ajustar estoque no Firebase: ' + err.message);
      }
    })();
  });
  // Ao clicar em um card de saída, exibe modal de detalhes de saída
  $(document).on('click', '.card-estoque[data-tipo="saida"]', function() {
    const produtos = JSON.parse($(this).attr('data-produtos'));
    const data = $(this).attr('data-data');
    const motivo = $(this).attr('data-local');
    let html = `<div class=\"modal-detalhe-saida-bg\" style=\"position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;z-index:99999;\">`;
    html += `<div class=\"modal-detalhe-saida\" style=\"background:#fff;border-radius:12px;box-shadow:0 2px 24px rgba(0,0,0,0.12);padding:32px 24px;width:400px;max-width:95vw;position:relative;\">`;
    html += `<h2 style=\"margin-top:0;color:#e91e63;font-family:'Orbitron',Arial,sans-serif;\">Detalhes da Saída</h2>`;
    html += `<div style=\"margin-bottom:12px;\"><strong>Data:</strong> ${data}<br><strong>Motivo:</strong> ${motivo}</div>`;
    html += `<ul style=\"padding-left:0;list-style:none;\">`;
    produtos.forEach(function(p) {
      html += `<li style=\"margin-bottom:8px;\">${p.nome} - QTD: ${p.qtd}</li>`;
    });
    html += `</ul>`;
    html += `<button type=\"button\" class=\"btn-editar-modal-detalhe-saida\" style=\"margin-top:16px;background:#27ae60;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Editar</button>`;
    html += `<button type=\"button\" class=\"btn-excluir-modal-detalhe-saida\" style=\"margin-top:16px;background:#e91e63;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;margin-right:8px;\">Excluir</button>`;
    html += `<button type=\"button\" class=\"btn-fechar-modal-detalhe-saida\" style=\"position:absolute;top:16px;right:18px;background:#111;color:#fff;border:none;border-radius:8px;padding:6px 18px;cursor:pointer;font-family:'Orbitron',Arial,sans-serif;font-size:1em;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:background 0.2s;\">Fechar</button>`;
    html += `</div></div>`;
    const modal = $(html);
    modal.data('cardRef', $(this));
    $('body').append(modal);
  });
  // Fecha modal de detalhes de saída
  $(document).on('click', '.btn-fechar-modal-detalhe-saida, .modal-detalhe-saida-bg', function(e) {
    // Sempre remove todos os modais de detalhe de saída
    $('.modal-detalhe-saida-bg').remove();
  });
  // Editar saída: abre modal preenchido
  $(document).on('click', '.btn-editar-modal-detalhe-saida', function() {
    const card = $(this).closest('.modal-detalhe-saida-bg').data('cardRef');
    const produtos = JSON.parse(card.attr('data-produtos'));
    let data = card.attr('data-data');
    // Converte dd-mm-aaaa para aaaa-mm-dd para o input type=date
    if (data && data.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const partes = data.split('-');
      data = `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    const motivo = card.attr('data-local');
    $('#dataSaidaEstoque').val(data);
    $('#motivoSaidaEstoque').val(motivo);
    $('.produtos-saida-estoque-lista').empty();
    produtos.forEach(function(p) {
      const itemHtml = `<div class=\"produto-saida-estoque-item\" style=\"display:flex;gap:8px;align-items:center;margin-bottom:8px;\">\n  <input type=\"text\" class=\"nome-produto-saida-estoque\" value=\"${p.nome}\" readonly style=\"width:120px;\">\n  <input type=\"number\" class=\"qtd-produto-saida-estoque\" min=\"1\" value=\"${p.qtd}\" style=\"width:60px;\">\n  <button type=\"button\" class=\"remover-produto-saida-estoque\" style=\"background:#e91e63;color:#fff;border:none;border-radius:50%;width:24px;height:24px;font-size:16px;cursor:pointer;\">×</button>\n</div>`;
      $('.produtos-saida-estoque-lista').append(itemHtml);
    });
    $('#modalSaidaEstoqueBg').fadeIn(200);
    $('.modal-detalhe-saida-bg').remove();
    $('#formSaidaEstoque').data('cardEditando', card);
  });

  // Excluir saída: remove card e devolve estoque com confirmação
  $(document).on('click', '.btn-excluir-modal-detalhe-saida', function() {
    if (!confirm('Deseja realmente excluir esta saída?')) return;
    const card = $(this).closest('.modal-detalhe-saida-bg').data('cardRef');
    // Remove do Firestore
    (async () => {
      try {
        const { getDocs, collection, query, where, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        // Busca o documento pelo data, motivo e produtos
        const saidaRef = collection(db, 'saida de estoque');
        const q = query(saidaRef,
          where('data', '==', card.attr('data-data')),
          where('motivo', '==', card.attr('data-local')),
          where('produtos', '==', JSON.parse(card.attr('data-produtos')))
        );
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
        card.remove();
        $('.modal-detalhe-saida-bg').remove();
      } catch (err) {
        alert('Erro ao excluir saída do Firebase: ' + err.message);
      }
    })();
  });})
