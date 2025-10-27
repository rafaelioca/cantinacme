// JS para funcionalidades do menu Formas de Pagamento
// Fonte Orbitron já aplicada via CSS

// IMPORTS CORRETOS PARA USO DIRETO NO NAVEGADOR
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

$(document).ready(function() {
  // Abrir modal ao clicar em Adicionar Forma de Pagamento
  $('#btnAdicionarPagamento').on('click', function() {
    $('#modalPagamentoBg').fadeIn(200);
  });

  // Fechar modal ao clicar no botão de fechar
  $('#btnFecharModalPagamento').on('click', function() {
    $('#modalPagamentoBg').fadeOut(200);
  });

  // Fechar modal ao clicar fora do modal
  $('#modalPagamentoBg').on('click', function(e) {
    if (e.target === this) {
      $(this).fadeOut(200);
    }
  });

  // Função para abrir modal preenchido para edição
  function abrirModalEdicao(card) {
    // Pega o nome (removendo ícone se houver)
    let nome = $(card).find('.nome-pagamento').clone();
    nome.find('img, i').remove();
    nome = nome.text().trim();
    // Pega o ícone
    let iconeSrc = $(card).find('img.icone-pagamento-img').attr('src');
    let icone = '';
    if (iconeSrc) {
      if (iconeSrc.includes('cartao.png')) icone = 'cartao.png';
      else if (iconeSrc.includes('dinheiro.webp')) icone = 'dinheiro.webp';
      else if (iconeSrc.includes('pix.webp')) icone = 'pix.webp';
    }
    $('#formaPagamento').val(nome);
    $("input[name='iconePagamento'][value='"+icone+"']").prop('checked', true);
    $('#modalPagamentoBg').fadeIn(200);
    $('#formPagamento').data('editando', card);
  }

  // Função para montar os cards a partir do Firebase
  async function carregarFormasPagamentoFirebase() {
    const querySnapshot = await getDocs(collection(db, "formasPagamento"));
    $('.lista-pagamento').empty();
    querySnapshot.forEach(docSnap => {
      const fp = docSnap.data();
      const id = docSnap.id;
      const icone = fp.icone || 'cartao.png';
      const card = `<div class=\"card-pagamento\" data-id=\"${id}\">
        <span class=\"nome-pagamento\"><img src=\"img/Pagamento/${icone}\" alt=\"\" class=\"icone-pagamento-img\" style=\"vertical-align:middle;margin-right:8px;\"> ${fp.nome}</span>
        <button class=\"btn-editar-pagamento\"><i class=\"fas fa-pencil-alt\"></i></button>
        <button class=\"btn-apagar-pagamento\"><i class=\"fas fa-trash\"></i></button>
      </div>`;
      $('.lista-pagamento').append(card);
    });
  }

  // Chama ao abrir a tela de formas de pagamento
  $('#menu-pagamento').on('click', function() {
    carregarFormasPagamentoFirebase();
  });

  // Submissão do formulário do modal
  $('#formPagamento').on('submit', async function(e) {
    e.preventDefault();
    console.log('Formulário enviado!');
    const forma = $('#formaPagamento').val();
    const icone = $('input[name="iconePagamento"]:checked').val();
    console.log('Forma:', forma, 'Ícone:', icone);
    const cardEditando = $(this).data('editando');
    if (cardEditando) {
      // Atualiza no Firebase
      const id = $(cardEditando).attr('data-id');
      if (id) {
        await updateDoc(doc(db, "formasPagamento", id), { nome: forma, icone });
        carregarFormasPagamentoFirebase();
      }
      $(this).removeData('editando');
    } else if (forma && icone) {
      // Adiciona no Firebase
      await addDoc(collection(db, "formasPagamento"), { nome: forma, icone });
      carregarFormasPagamentoFirebase();
    }
    $('#modalPagamentoBg').fadeOut(200);
    this.reset();
  });

  // Apagar forma de pagamento
  $(document).on('click', '.btn-apagar-pagamento', async function() {
    if(confirm('Deseja apagar esta forma de pagamento?')) {
      const card = $(this).closest('.card-pagamento');
      const id = card.attr('data-id');
      if (id) {
        await deleteDoc(doc(db, "formasPagamento", id));
        carregarFormasPagamentoFirebase();
      }
    }
  });

  // Editar forma de pagamento
  $(document).on('click', '.btn-editar-pagamento', function() {
    abrirModalEdicao($(this).closest('.card-pagamento'));
  });
});

// Para integração com Firebase, recomenda-se primeiro estruturar toda a lógica local e depois conectar os eventos ao backend.
// Assim, você pode testar toda a interface antes de integrar os dados reais.
