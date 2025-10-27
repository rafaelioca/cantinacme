import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db, auth } from './firebase-init.js';

// JS para funcionalidades do menu Clientes
$(document).ready(function() {
  // Abrir relatório do cliente na mesma tela ao clicar no NOME
  $(document).on('click', '.card-cliente .nome-cliente', async function(e) {
    e.stopPropagation();
    const nome = $(this).text().trim();
    try {
      if (!nome) return;
      if (typeof window.abrirVendasCliente !== 'function') {
        await import('./clientes-vendas.js');
      }
      if (typeof window.abrirVendasCliente === 'function') {
        // Volta a abrir o relatório completo com botão Exportar e Pagar
        window.abrirVendasCliente(nome);
      } else {
        alert('Não foi possível abrir o relatório agora.');
      }
    } catch (err) {
      console.error('[clientes] erro ao abrir relatório do cliente:', err);
      alert('Não foi possível iniciar o pagamento do cliente.');
    }
  });
  // Abrir modal ao clicar em Adicionar Clientes
  $('.btn-add-clientes').on('click', function() {
    $('#modalClientesBg').fadeIn(200);
  });

  // Fechar modal ao clicar no botão de fechar
  $('#btnFecharModalCliente').on('click', function() {
    $('#modalClientesBg').fadeOut(200);
  });

  // Fechar modal ao clicar fora do modal
  $('#modalClientesBg').on('click', function(e) {
    if (e.target === this) {
      $(this).fadeOut(200);
    }
  });

  // Função para abrir modal preenchido para edição
  function abrirModalEdicaoCliente(card) {
    // Limpa campos antes de preencher
    $('#formCliente')[0].reset();
    // Pega o nome e telefone do cliente
    const nome = $(card).find('.nome-cliente').text().trim();
    const telefone = $(card).find('.telefone-cliente').text().trim();
    $('#nomeCliente').val(nome);
    $('#telefoneCliente').val(telefone);
    $('#modalClientesBg').fadeIn(200);
    $('#formCliente').data('editando', card);
  }

  // Delegação para botões de editar (funciona para novos cards)
  $(document).on('click', '.btn-editar-cliente', function() {
    abrirModalEdicaoCliente($(this).closest('.card-cliente'));
  });

  // Delegação para botões de apagar (funciona para novos cards)
  $(document).on('click', '.btn-apagar-cliente', function() {
    if(confirm('Deseja apagar este cliente?')) {
      $(this).closest('.card-cliente').remove();
    }
  });

  // Submissão do formulário do modal
  $('#formCliente').on('submit', function(e) {
    e.preventDefault();
    const nome = $('#nomeCliente').val();
    const telefone = $('#telefoneCliente').val();
    const cardEditando = $(this).data('editando');
    if (cardEditando) {
      // Atualiza card existente
      $(cardEditando).find('.nome-cliente').text(nome);
      $(cardEditando).find('.telefone-cliente').text(telefone);
      $(this).removeData('editando');
    } else if (nome && telefone) {
      // Adiciona novo card
      const novoCard = `
        <div class="card-cliente">
          <span class="nome-cliente">${nome}</span>
          <span class="telefone-cliente">${telefone}</span>
          <button class="btn-editar-cliente"><i class="fas fa-pencil-alt"></i></button>
          <button class="btn-apagar-cliente"><i class="fas fa-trash"></i></button>
        </div>
      `;
      $('.lista-clientes').append(novoCard);
    }
    $('#modalClientesBg').fadeOut(200);
    this.reset();
  });

  // Busca dinâmica de clientes
  $('.busca-clientes').on('input', function() {
    const termo = $(this).val().toLowerCase();
    $('.lista-clientes .card-cliente').each(function() {
      const nome = $(this).find('.nome-cliente').text().toLowerCase();
      if (nome.includes(termo)) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  });
});

// Função para montar os cards de clientes a partir do Firebase
async function carregarClientesFirebase() {
  const querySnapshot = await getDocs(collection(db, "clientes"));
  document.querySelector('.lista-clientes').innerHTML = '';
  querySnapshot.forEach(docSnap => {
    const cli = docSnap.data();
    const id = docSnap.id;
    const card = `<div class=\"card-cliente\" data-id=\"${id}\">
      <span class=\"nome-cliente\">${cli.nome}</span>
      <span class=\"telefone-cliente\">${cli.telefone || ''}</span>
      <button class=\"btn-editar-cliente\"><i class=\"fas fa-pencil-alt\"></i></button>
      <button class=\"btn-apagar-cliente\"><i class=\"fas fa-trash\"></i></button>
    </div>`;
    document.querySelector('.lista-clientes').insertAdjacentHTML('beforeend', card);
  });
}

// Chama ao abrir o menu clientes
if (document.getElementById('menu-clientes')) {
  document.getElementById('menu-clientes').addEventListener('click', carregarClientesFirebase);
}

// Submissão do formulário de cliente
if (document.getElementById('formCliente')) {
  document.getElementById('formCliente').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nome = document.getElementById('nomeCliente').value;
    const telefone = document.getElementById('telefoneCliente').value;
    const cardEditando = this.dataset.editandoId;
    if (cardEditando) {
      await updateDoc(doc(db, "clientes", cardEditando), { nome, telefone });
      delete this.dataset.editandoId;
      carregarClientesFirebase();
    } else if (nome) {
      await addDoc(collection(db, "clientes"), { nome, telefone });
      carregarClientesFirebase();
    }
    document.getElementById('modalClientesBg').style.display = 'none';
    this.reset();
  });
}

// Apagar cliente
if (document.querySelector('.lista-clientes')) {
  document.querySelector('.lista-clientes').addEventListener('click', async function(e) {
    if (e.target.closest('.btn-apagar-cliente')) {
      if (confirm('Deseja apagar este cliente?')) {
        const card = e.target.closest('.card-cliente');
        const id = card.getAttribute('data-id');
        if (id) {
          await deleteDoc(doc(db, "clientes", id));
          carregarClientesFirebase();
        }
      }
    }
    // Editar cliente
    if (e.target.closest('.btn-editar-cliente')) {
      const card = e.target.closest('.card-cliente');
      const nome = card.querySelector('.nome-cliente').textContent;
      const telefone = card.querySelector('.telefone-cliente').textContent;
      document.getElementById('nomeCliente').value = nome;
      document.getElementById('telefoneCliente').value = telefone;
      document.getElementById('formCliente').dataset.editandoId = card.getAttribute('data-id');
      document.getElementById('modalClientesBg').style.display = 'block';
    }
  });
}
