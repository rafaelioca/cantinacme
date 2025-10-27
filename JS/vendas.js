import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// JS para funcionalidades do menu Vendas
$(document).ready(function() {
  // Validação ao confirmar compra
  $(document).on('click', '.btn-confirmar', function(e) {
    // ...validações já existentes...
    // Só registra venda se as validações forem atendidas
    if ($('.lista-venda tbody tr').length === 0) {
      alert('Selecione pelo menos um produto para realizar a venda.');
      return;
    }
  var clienteSelecionado = $('.vendas-nome-cliente').text().trim() !== "" && $('.vendas-nome-cliente').text().trim() !== "Nome do Cliente";
    if (!clienteSelecionado) {
      alert('Selecione um cliente para realizar a venda.');
      return;
    }
    // REGISTRA VENDA NO FIREBASE
    (async () => {
      const { collection, addDoc, getDocs, query, where, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      // Dados do cliente
      let cliente = $('.busca-clientes').val() || $('.cliente-selecionado').text();
      // Data e hora da compra
      let agora = new Date();
      let dataCompra = agora.toLocaleDateString('pt-BR');
      let horaCompra = agora.toLocaleTimeString('pt-BR');
      // Produtos comprados
      let produtos = [];
      let valorTotal = 0;
      $('.lista-venda tbody tr').each(function() {
        let nome = $(this).find('td').eq(0).text();
        let qtd = parseInt($(this).find('td').eq(1).text(), 10) || 1;
        let valor = parseFloat($(this).find('td').eq(2).text().replace(',','.')) || 0;
        produtos.push({ nome, qtd, valor });
        valorTotal += valor;
      });
      // Observação
      let observacao = $('.observacao').val() || "";
      // Salva venda no Firebase
      await addDoc(collection(db, 'vendas'), {
        cliente,
        data: dataCompra,
        hora: horaCompra,
        produtos,
        valorTotal,
        observacao
      });
      // Dá baixa no estoque dos produtos vendidos
      for (const p of produtos) {
        const produtosRef = collection(db, 'produtos');
        const q = query(produtosRef, where('nome', '==', p.nome));
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          const prodData = docSnap.data();
          let novoEstoque = (prodData.estoque || 0) - (parseInt(p.qtd) || 0);
          // Permite valores negativos
          await updateDoc(docSnap.ref, { estoque: novoEstoque });
        });
      }
      alert('Venda registrada com sucesso!');
      // Limpa venda após registrar
      $('.lista-venda tbody').empty();
      $('.total-venda').html('TOTAL<br>R$ 0,00');
      $('.busca-clientes').val('');
      $('.vendas-nome-cliente').text('');
      $('.observacao').val('');
      // Atualiza lista de produtos para mostrar estoque atualizado
      if (typeof atualizarProdutosVendasFirebase === 'function') {
        atualizarProdutosVendasFirebase();
      }
    })();
    // Verifica se há pelo menos um produto
    if ($('.lista-venda tbody tr').length === 0) {
      alert('Selecione pelo menos um produto para realizar a venda.');
      e.preventDefault();
      return;
    }
    // Observação é opcional, não precisa validar
    // ...existing code para finalizar compra...
  });
  // Edita quantidade ao clicar no lápis
  $(document).on('click', '.lista-venda tbody .fa-pencil-alt', function() {
    var $linha = $(this).closest('tr');
    var nome = $linha.find('td').first().text();
    var qtdAtual = parseInt($linha.find('td').eq(1).text(), 10) || 1;
    var novaQtd = prompt('Editar quantidade para: ' + nome, qtdAtual);
    if (novaQtd === null) return; // Cancelou
    novaQtd = parseInt(novaQtd, 10);
    if (isNaN(novaQtd) || novaQtd < 0) return;
    if (novaQtd === 0) {
      $linha.remove();
    } else {
      $linha.find('td').eq(1).text(novaQtd);
      // Atualiza valor total da linha
      var precoUnit = $linha.find('td').eq(2).text().replace(/[^\d\.,]/g,'').replace(',','.');
      precoUnit = parseFloat(precoUnit) / qtdAtual;
      var valor = precoUnit * novaQtd;
      $linha.find('td').eq(2).html(valor.toFixed(2) + ' <i class="fas fa-pencil-alt" style="cursor:pointer;"></i>');
    }
    atualizarTotalVenda();
  });
  // Adiciona produto à venda ao clicar no card-produto
  $(document).on('click', '.lista-produtos .card-produto', function() {
    const nome = $(this).find('.nome').text();
    const preco = $(this).find('.preco').text().replace('R$','').replace(',','.').trim();
    // Verifica se já existe esse produto na tabela
    var $linha = $('.lista-venda tbody tr').filter(function() {
      return $(this).find('td').first().text() === nome;
    });
    if ($linha.length) {
      // Se já existe, incrementa a quantidade
      var qtd = parseInt($linha.find('td').eq(1).text(), 10) || 0;
      $linha.find('td').eq(1).text(qtd + 1);
      // Atualiza valor total da linha
      var valor = parseFloat(preco) * (qtd + 1);
      $linha.find('td').eq(2).html(valor.toFixed(2) + ' <i class="fas fa-pencil-alt" style="cursor:pointer;"></i>');
    } else {
      // Se não existe, adiciona nova linha
      var html = `<tr><td>${nome}</td><td>1</td><td>${parseFloat(preco).toFixed(2)} <i class="fas fa-pencil-alt" style="cursor:pointer;"></i></td></tr>`;
      $('.lista-venda tbody').append(html);
    }
    atualizarTotalVenda();
  });

  // Função para atualizar o total da venda
  function atualizarTotalVenda() {
    var total = 0;
    $('.lista-venda tbody tr').each(function() {
      var valor = $(this).find('td').eq(2).text();
      valor = valor.replace(',','.').replace(/[^\d\.]/g,'');
      total += parseFloat(valor) || 0;
    });
    $('.total-venda').html('TOTAL<br>R$ ' + total.toFixed(2));
  }
  // Atalho: botão + ao lado do campo de busca de clientes abre modal de adicionar cliente
  $('.btn-add-cliente').on('click', function() {
    $('#modalClientesBg').fadeIn(200);
  });
  // Função para mostrar lista de clientes filtrada e selecionar
  async function buscarClientesFirebase(termo) {
    const db = getFirestore();
    const querySnapshot = await getDocs(collection(db, "clientes"));
    const clientes = [];
    querySnapshot.forEach(docSnap => {
      const cli = docSnap.data();
      if (cli.nome && cli.nome.toLowerCase().includes(termo)) {
        clientes.push({ nome: cli.nome, telefone: cli.telefone || "" });
      }
    });
    return clientes;
  }

  function mostrarListaClientesVendas(termo) {
    buscarClientesFirebase(termo).then(clientes => {
      var html = '';
      clientes.forEach(function(cli) {
        html += `<div class="item-cliente-venda" style="padding:8px 16px;cursor:pointer;border-bottom:1px solid #eee;" data-nome="${cli.nome}">
          <span style="font-weight:bold;">${cli.nome}</span>
        </div>`;
      });
      var $sugestoes = $('.sugestoes-clientes-venda');
      if ($sugestoes.length === 0) {
        $sugestoes = $('<div class="sugestoes-clientes-venda" style="position:absolute;z-index:10;background:#fff;border:1px solid #0a3a4a;border-radius:12px;box-shadow:0 2px 8px #0002;width:100%;max-width:400px;"></div>');
        $('.busca-clientes').after($sugestoes);
      }
      $sugestoes.html(html);
      if (html && termo) {
        $sugestoes.show();
      } else {
        $sugestoes.hide();
      }
    });
  }

  // Evento de digitação no campo de busca de clientes do bloco de vendas
  $('.busca-clientes').on('input', function() {
    const termo = $(this).val().toLowerCase();
    mostrarListaClientesVendas(termo);
  });

  // Evento de clique em sugestão de cliente
  $(document).on('click', '.sugestoes-clientes-venda .item-cliente-venda', function() {
    var nome = $(this).data('nome');
    var telefone = $(this).data('telefone');
    $('.vendas-nome-cliente').text(nome + (telefone ? ' - ' + telefone : ''));
    $('.sugestoes-clientes-venda').hide();
    $('.busca-clientes').val(nome);
  });

  // Esconde sugestões ao perder foco
  $('.busca-clientes').on('blur', function() {
    setTimeout(function() {
      $('.sugestoes-clientes-venda').hide();
    }, 200);
  });
  // Função para exibir os produtos cadastrados no menu Vendas
  function atualizarProdutosVendas() {
    var produtos = [];
    // Pega todos os produtos cadastrados no menu Produtos
    $('.lista-produtos-geral .card-produto-geral').each(function() {
      const nome = $(this).find('.nome').text();
      const imagem = $(this).find('img').attr('src');
      const preco = $(this).find('.preco').text();
      produtos.push({ nome, imagem, preco });
    });
    // Limpa e insere os produtos na lista do menu Vendas
    var html = '';
    produtos.forEach(function(prod) {
      html += `<div class="card-produto">
        <img src="${prod.imagem}" alt="${prod.nome}">
        <div class="nome">${prod.nome}</div>
        <div class="preco">${prod.preco}</div>
      </div>`;
    });
    $('.lista-produtos').html(html);
  }

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
  const db = getFirestore(app);

  async function atualizarProdutosVendasFirebase() {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    const listaProdutos = document.querySelector(".lista-produtos");
    if (!listaProdutos) return;
    listaProdutos.innerHTML = "";
      querySnapshot.forEach(docSnap => {
        const prod = docSnap.data();
        const imagem = prod.imagem ? prod.imagem : 'img/Pagamento/default.png';
        let estoqueAtual = prod.estoque !== undefined ? prod.estoque : 0;
        var estoqueClass = estoqueAtual < 0 ? 'estoque-negativo' : 'estoque';
        var html = `<div class="card-produto">
          <img src="${imagem}" alt="${prod.nome}">
          <div class="nome">${prod.nome}</div>
          <div class="preco">R$ ${parseFloat(prod.preco).toFixed(2)}</div>
          <div class="${estoqueClass}">Estoque: ${estoqueAtual}</div>
        </div>`;
        listaProdutos.innerHTML += html;
      });
  }

  // Carrega produtos do Firebase na tela de vendas ao iniciar
  atualizarProdutosVendasFirebase();

  // Atualiza ao abrir o menu Vendas
  $('#menu-vendas').on('click', function() {
    atualizarProdutosVendasFirebase();
  });

  // Busca dinâmica de produtos no menu Vendas
  $('.busca-produtosvendas').on('input', function() {
    const termo = $(this).val().toLowerCase();
    $('.lista-produtos .card-produto').each(function() {
      const nome = $(this).find('.nome').text().toLowerCase();
      if (nome.includes(termo)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
});
