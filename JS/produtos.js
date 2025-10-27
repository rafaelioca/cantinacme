// IMPORTS FIREBASE PARA USO DIRETO NO NAVEGADOR
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// JS para funcionalidades do menu Produtos
$(document).ready(function() {
  // Abrir modal ao clicar em Adicionar Produtos
  $('.btn-add-produto').on('click', function() {
    $('#modalProdutosBg').fadeIn(200);
  });

  // Fechar modal ao clicar no botão de fechar
  $('#btnFecharModalProduto').on('click', function() {
    $('#modalProdutosBg').fadeOut(200);
  });

  // Fechar modal ao clicar fora do modal
  $('#modalProdutosBg').on('click', function(e) {
    if (e.target === this) {
      $(this).fadeOut(200);
    }
  });

  // Função para abrir modal preenchido para edição de produto
  function abrirModalEdicaoProduto(card) {
    const nome = $(card).find('.nome').text().trim();
    const imagem = $(card).find('img').attr('src');
    const preco = $(card).find('.preco').text().replace('R$','').trim();
    const id = $(card).attr('data-id');
    $('#nomeProduto').val(nome);
    $('#imagemProduto').val(imagem);
    $('#precoProduto').val(preco.replace(',','.'));
    $('#modalProdutosBg').fadeIn(200);
    $('#formProduto').attr('data-editando-id', id);
    // Adiciona botão excluir se não existir
    if ($('#btnExcluirProduto').length === 0) {
      const btnExcluir = $('<button id="btnExcluirProduto" type="button">Excluir Produto</button>');
      btnExcluir.insertAfter('#formProduto button[type="submit"]');
      btnExcluir.on('click', async function() {
        if (confirm('Deseja realmente excluir este produto?')) {
          await deleteDoc(doc(db, "produtos", id));
          $('#modalProdutosBg').fadeOut(200);
          carregarProdutosFirebase();
        }
      });
    } else {
      $('#btnExcluirProduto').off('click').on('click', async function() {
        if (confirm('Deseja realmente excluir este produto?')) {
          await deleteDoc(doc(db, "produtos", id));
          $('#modalProdutosBg').fadeOut(200);
          carregarProdutosFirebase();
        }
      });
    }
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

  // Função para montar os cards de produtos a partir do Firebase
  async function carregarProdutosFirebase() {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    document.querySelector('.lista-produtos-geral').innerHTML = '';
    querySnapshot.forEach(docSnap => {
      const prod = docSnap.data();
      const id = docSnap.id;
      const imagem = prod.imagem ? prod.imagem : 'img/Pagamento/default.png';
      let estoqueAtual = prod.estoque !== undefined ? prod.estoque : 0;
      let precoFormatado = '';
      if (prod.preco !== undefined && prod.preco !== null && prod.preco !== '') {
        const valor = parseFloat(prod.preco);
        precoFormatado = 'R$ ' + valor.toFixed(2).replace('.', ',');
      }
      const estoqueClass = estoqueAtual < 0 ? 'estoque negativo' : 'estoque';
      const card = `<div class="card-produto-geral" data-id="${id}">
        <img src="${imagem}" alt="${prod.nome}">
        <div class="nome">${prod.nome}</div>
        <div class="${estoqueClass}">Estoque: ${estoqueAtual}</div>
        <div class="preco">${precoFormatado}</div>
      </div>`;
      document.querySelector('.lista-produtos-geral').insertAdjacentHTML('beforeend', card);
    });
  }

  // Chama ao abrir o menu produtos
  if (document.getElementById('menu-produtos')) {
    document.getElementById('menu-produtos').addEventListener('click', carregarProdutosFirebase);
  }

  // Limpa campos ao abrir modal de adicionar produto
  if (document.querySelector('.btn-add-produto')) {
    document.querySelector('.btn-add-produto').addEventListener('click', function() {
      document.getElementById('nomeProduto').value = '';
      document.getElementById('precoProduto').value = '';
      document.getElementById('imagemProduto').value = '';
      document.getElementById('formProduto').removeAttribute('data-editando-id');
      document.getElementById('modalProdutosBg').style.display = 'block';
    });
  }

  // Submissão do formulário de produto
  if (document.getElementById('formProduto')) {
    document.getElementById('formProduto').addEventListener('submit', async function(e) {
      e.preventDefault();
      const nome = document.getElementById('nomeProduto').value;
      const preco = document.getElementById('precoProduto').value;
      const imagem = document.getElementById('imagemProduto').value;
      const idEditando = this.getAttribute('data-editando-id');
      if (idEditando) {
        await updateDoc(doc(db, "produtos", idEditando), { nome, preco, imagem });
        this.removeAttribute('data-editando-id');
        carregarProdutosFirebase();
        atualizarProdutosVendas();
      } else if (nome) {
        await addDoc(collection(db, "produtos"), { nome, preco, imagem });
        carregarProdutosFirebase();
        atualizarProdutosVendas();
      }
      document.getElementById('modalProdutosBg').style.display = 'none';
      this.reset();
    });
  // Atualiza os produtos na tela de vendas
  async function atualizarProdutosVendas() {
    const querySnapshot = await getDocs(collection(db, "produtos"));
    const listaProdutos = document.querySelector(".lista-produtos");
    if (!listaProdutos) return;
    listaProdutos.innerHTML = "";
    querySnapshot.forEach(docSnap => {
      const prod = docSnap.data();
      const imagem = prod.imagem ? prod.imagem : 'img/Pagamento/default.png';
      const estoque = prod.estoque !== undefined ? prod.estoque : 0;
      let precoFormatado = '';
      if (prod.preco !== undefined && prod.preco !== null && prod.preco !== '') {
        const valor = parseFloat(prod.preco);
        precoFormatado = 'R$ ' + valor.toFixed(2).replace('.', ',');
      }
      const card = document.createElement("div");
      card.className = "card-produto";
      card.innerHTML = `
        <img src="${imagem}" alt="${prod.nome}">
        <div class="nome">${prod.nome}</div>
        <div class="estoque">Estoque: ${estoque}</div>
        <div class="preco">${precoFormatado}</div>
      `;
      listaProdutos.appendChild(card);
    });
  }
  }


  // Apagar produto e editar produto
  if (document.querySelector('.lista-produtos-geral')) {
    document.querySelector('.lista-produtos-geral').addEventListener('click', function(e) {
      const card = e.target.closest('.card-produto-geral');
      if (card) {
        abrirModalEdicaoProduto(card);
      }
    });
  }

  // Busca dinâmica de produtos
  $('.busca-produtos').on('input', function() {
    const termo = $(this).val().toLowerCase();
    $('.lista-produtos-geral .card-produto-geral').each(function() {
      const nome = $(this).find('.nome').text().toLowerCase();
      if (nome.includes(termo)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
});
