// Exemplo de geração dinâmica do relatório de clientes
// Substitua por integração real com Firebase se necessário

document.getElementById('btn-exportar-pdf').onclick = function() {
  if (window.html2pdf) {
    html2pdf().set({
      margin: 10,
      filename: 'Relatorio_Clientes.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(document.getElementById('conteudo-relatorio')).save();
  } else {
    alert('Biblioteca html2pdf não carregada!');
  }
};

// Exemplo de conteúdo dinâmico
window.onload = function() {
  const conteudo = document.getElementById('conteudo-relatorio');
  conteudo.innerHTML = `<ul>
    <li>Cliente 1 - Telefone: (99) 99999-9999</li>
    <li>Cliente 2 - Telefone: (88) 88888-8888</li>
    <li>Cliente 3 - Telefone: (77) 77777-7777</li>
  </ul>`;
};
