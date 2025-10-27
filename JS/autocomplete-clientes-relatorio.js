// Autocomplete para campo de busca de clientes nos relatórios


// Este arquivo não deve conter imports. O autocomplete de clientes foi movido para relatorio-vendas-em-aberto.js, que já inicializa o Firebase e implementa o autocomplete corretamente.

document.addEventListener('DOMContentLoaded', async function() {
  const inputBusca = document.querySelector('#relatorio-vendas-aberto .busca-relatorio-cliente');
  const listaDiv = document.querySelector('#relatorio-vendas-aberto .lista-clientes-relatorio');
  if (!inputBusca || !listaDiv) return;

  let clientes = await window.carregarClientesRelatorio();

  function mostrarLista(filtrados) {
    listaDiv.innerHTML = '';
    if (filtrados.length === 0) {
      listaDiv.style.display = 'none';
      return;
    }
    filtrados.forEach(nome => {
      const item = document.createElement('div');
      item.textContent = nome;
      item.style = 'padding:8px;cursor:pointer;border-bottom:1px solid #eee;';
      item.onclick = () => {
        inputBusca.value = nome;
        listaDiv.style.display = 'none';
        document.querySelector('.cliente-selecionado-aberto').textContent = nome;
        document.querySelector('.cliente-selecionado-aberto').style.display = 'block';
      };
      listaDiv.appendChild(item);
    });
    listaDiv.style.display = 'block';
  }

  inputBusca.addEventListener('input', function() {
    const termo = inputBusca.value.trim().toLowerCase();
    if (!termo) {
      mostrarLista(clientes);
      return;
    }
    const filtrados = clientes.filter(nome => nome.toLowerCase().includes(termo));
    mostrarLista(filtrados);
  });

  // Mostra todos ao focar/editar
  inputBusca.addEventListener('focus', function() {
    mostrarLista(clientes);
  });

  // Fecha lista ao clicar fora
  document.addEventListener('click', function(e) {
    if (!listaDiv.contains(e.target) && e.target !== inputBusca) {
      listaDiv.style.display = 'none';
    }
  });
});
