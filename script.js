// Seleciona o canvas e o botão de limpar
const canvas = document.querySelector("#tela");
const context = canvas.getContext("2d");
const btnLimpar = document.querySelector("#btn-limpa");
const tabelaPoligonos = document.querySelector(".lista-poligonos");
const btnInfo = document.querySelector("#btn-info");

// Verifica se o canvas foi carregado corretamente
if (!context) {
  alert("Navegador não suporta canvas");
}

//Classe Poligono para armazenarmos as informações de cada polígono e desenhar na tela
class Poligono {
  constructor() {
    this.vertices = [];
    this.corAresta = "#f5ed05";
    this.corPoligono = "#f5ed05";
    this.arestas = [];
    this.ponto = null;
    this.primeiroVertice = null;
  }

  setPonto(ponto) {
    this.ponto = ponto;
    if (this.vertices.length === 0) {
      this.primeiroVertice = ponto;
    }
  }

  adicionarVertice(vertice) {
    this.vertices.push(vertice);
  }

  adicionarAresta(aresta) {
    this.arestas.push(aresta);
  }

  desenharVertice() {
    context.beginPath();
    context.arc(this.ponto.x, this.ponto.y, 2, 0, 2 * Math.PI); // Desenha um círculo 
    context.fillStyle = "#000";
    context.fill();
    context.closePath();
  }

  desenharAresta(vertice1, vertice2) {
    context.beginPath();
    context.moveTo(vertice1.x, vertice1.y);
    context.lineTo(vertice2.x, vertice2.y);
    context.strokeStyle = this.corAresta;
    context.stroke();
    this.adicionarAresta({ vertice1, vertice2 }); // Adiciona a aresta ao array de arestas
  }

  desenharPoligono() { 
    context.beginPath();
    context.moveTo(this.vertices[0].x, this.vertices[0].y); // Move o cursor para o primeiro vértice
  
    for (let i = 1; i < this.vertices.length; i++) {
      context.lineTo(this.vertices[i].x, this.vertices[i].y); // Desenha as linhas
    }    
    context.closePath();
    // Preenche o polígono
    fillPoly(this)
    context.strokeStyle = this.corAresta; // Define a cor da aresta
    context.stroke();
  }
  

}

// Armazena os polígonos
let poligonos = [];
let poligonoAtual = new Poligono();

// Função para atualizar a tabela de polígonos (Sidebar)
function alteracaoTabelaPoligonos() {
  tabelaPoligonos.innerHTML = "";
  poligonos.forEach((poligono, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><h3>Poligono: ${index + 1}</h3></td>
        <td>
          <input type="color" class="btn-cor" value="${
            poligono.corAresta
          }" onchange="alterarCorAresta(${index}, this.value)" />
        </td>
        <td>
          <input type="color" class="btn-cor" value="${
            poligono.corPoligono
          }" onchange="alterarCorPoligono(${index}, this.value)" />
        </td>
        <td>
          <button class="btn-rm btn" onclick="removePoligonoAtual(${index})">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      `;
    tabelaPoligonos.appendChild(tr);
  });
}

//Remove o poligono escolhidp na sidebar
function removePoligonoAtual(index) {
    poligonos.splice(index, 1); // Remove o polígono do array usando o índice
    redesenharPoligonos();
    alteracaoTabelaPoligonos();
}

//Funções pra mudança de cor da sidebar
function alterarCorAresta(index, cor) {
    poligonos[index].corAresta = cor;
    redesenharPoligonos()
  }
  
  function alterarCorPoligono(index, cor) {
    poligonos[index].corPoligono = cor;
    redesenharPoligonos()
  }
  
// Função para preencher polígono
function fillPoly(poligono) {
    if(poligono.vertices.length === 0) {
        return;
    }

    // Inicializar o Ymin e Ymax
    let yMin = poligono.vertices[0].y;
    let yMax = poligono.vertices[0].y;
    // Encontrar o menor y e o maior y
    for (let i = 1; i < poligono.vertices.length; i++) {
        const y = poligono.vertices[i].y; 
        yMin = Math.min(yMin, y); 
        yMax = Math.max(yMax, y); 
    }

    // Calcular o número de scanlines
    const num_scanlines = yMax - yMin + 1;

    // Inicializar o array de interseções
    const intersecoes = Array.from({ length: num_scanlines }, () => ({
      y: 0,
      interseccao: [],
    }));

    // Pegar as arestas do polígono pra calcular a taxa
    const arestas = poligono.arestas;

    for (let i = 0; i < arestas.length; i++) {
      const vertice1 = arestas[i].vertice1;
      const vertice2 = arestas[i].vertice2;
      if (vertice1.y === vertice2.y) continue; // Ignorar arestas horizontais

      // Determinar ymin e ymax para a aresta
      let ymin = Math.min(vertice1.y, vertice2.y);
      let ymax = Math.max(vertice1.y, vertice2.y);

      const taxa = (vertice2.x - vertice1.x) / (vertice2.y - vertice1.y); //coeficiente angular

      // Inicializar as coordenadas x
      let x = vertice1.y === ymin ? vertice1.x : vertice2.x;

      // Armazenar interseções em scanlines
      for (let y = ymin; y < ymax; y++) {
        intersecoes[y - yMin].y = y; // Armazena a coordenada y da scanline
        intersecoes[y - yMin].interseccao.push(x); // Armazena a interseção
        x += taxa; // Incrementar taxa
      }
    }
    
    context.fillStyle = poligono.corPoligono;
    // Preencher a área
    for (let i = 0; i < intersecoes.length; i++) {
      if (intersecoes[i].interseccao.length < 2) continue; // Pular se não houver interseções suficientes

      // Ordenar as interseções (ordem certa)
      intersecoes[i].interseccao.sort((a, b) => a - b);

      // Preencher entre cada par de interseções
      for (let j = 0; j < intersecoes[i].interseccao.length - 1; j += 2) {
        const xInicio = Math.floor(intersecoes[i].interseccao[j]);
        const xFim = Math.floor(intersecoes[i].interseccao[j + 1]);
        for (let x = xInicio; x < xFim; x++) {
          context.fillRect(x, intersecoes[i].y, 1, 1); // Preencher o pixel
        }
      }
    }
}

// Limpa todos os polígonos do canvas
btnLimpar.addEventListener("click", () => {
  poligonos = [];
  context.clearRect(0, 0, canvas.width, canvas.height);
  poligonoAtual = new Poligono();
  alteracaoTabelaPoligonos();
});


function redesenharPoligonos() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Redesenha os polígonos em ordem
    poligonos.forEach((poligono, index) => {
      fillPoly(poligono); 
      poligono.desenharPoligono(); 
    });
}

let preventClick = false;
let isDrawing = false;

// Evento de clique simples no canvas (para adicionar vértices)
canvas.addEventListener("click", (event) => {
    if (preventClick) {
        preventClick = false; // Reseta a flag para o próximo clique
        return;
    }

    if (!isDrawing) 
        isDrawing = true;


    // Adiciona um pequeno delay para esperar se o clique é um duplo clique
    setTimeout(() => {
        const ponto = {
            x: event.offsetX,
            y: event.offsetY,
        };

        // Verifica se o ponto atual tá próximo do primeiro vértice para fechar o polígono
        if (
            poligonoAtual.vertices.length > 2 &&
            Math.abs(ponto.x - poligonoAtual.primeiroVertice.x) <= 3 &&
            Math.abs(ponto.y - poligonoAtual.primeiroVertice.y) <= 3
        ) {
            poligonoAtual.desenharAresta(
                poligonoAtual.vertices[poligonoAtual.vertices.length - 1],
                poligonoAtual.primeiroVertice
            );
            poligonos.push(poligonoAtual);
            alteracaoTabelaPoligonos();
            fillPoly(poligonoAtual);
            poligonoAtual = new Poligono();
            isDrawing = false;
        } else {
          if(isDrawing) {
            // Desenha o ponto clicado
            poligonoAtual.setPonto(ponto);
            poligonoAtual.desenharVertice();

            // Desenha a aresta entre o ponto anterior e o novo
            if (poligonoAtual.vertices.length > 0) {
                const ultimoVertice =
                    poligonoAtual.vertices[poligonoAtual.vertices.length - 1];
                poligonoAtual.desenharAresta(ultimoVertice, ponto);
            }
            poligonoAtual.adicionarVertice(ponto);
          }
        }

    }, 250); // garantir que não seja um duplo clique
});

// Evento de duplo clique no canvas para mudar a cor do polígono ou removê-lo
canvas.addEventListener("dblclick", (event) => {
  isDrawing = false;
  preventClick = true;

  let poligonoSelecionado = null;

  // Itera de cima para baixo
  for (let i = poligonos.length - 1; i >= 0; i--) {
    const poligono = poligonos[i];
    if (context.isPointInPath(new Path2D(polygonPath(poligono.vertices)), event.offsetX, event.offsetY)) {
      poligonoSelecionado = poligono;
      break; // Para quando encontrar o primeiro polígono (o mais "superficial")
    }
  }

  if (poligonoSelecionado) {
      Swal.fire({
          title: 'Editar polígono',
          input: 'text',
          inputAttributes: {
              id: 'colorPicker'
          },
          showCancelButton: true,
          confirmButtonText: 'Alterar cor',
          cancelButtonText: 'Cancelar',
          showDenyButton: true,  
          denyButtonText: 'Remover polígono',
          didOpen: () => {
              const colorInput = Swal.getInput();
              colorInput.type = 'color';
              colorInput.value = poligonoSelecionado.corPoligono;  
          },
          preConfirm: (color) => {
              poligonoSelecionado.corPoligono = color;
              redesenharPoligonos(); 
          },
          preDeny: () => {
              const index = poligonos.indexOf(poligonoSelecionado);
              if (index > -1) {
                  poligonos.splice(index, 1);
                  redesenharPoligonos(); 
                  alteracaoTabelaPoligonos(); 
              }
          }
      });
  }
});

btnInfo.addEventListener("click", (e) =>{
  Swal.fire({
    title: 'Informações',
    html: `
      <h3> Como usar: </h3>
      <li> Para criação de polígonos, clique no canvas para adicionar vértices, o poligono é formado quando se é clicado novamente no vertice inicial (minimo 3 vértices) </li>
      <li> Para alterar a cor de um polígono, clique duas vezes sobre ele ou consulte a sidebar </li>
      <li> Para remover um polígono, clique duas vezes sobre ele ou consulte a sidebar </li>
      <li> Para limpar o canvas, clique no botão "Limpar" </li>

    `,
    confirmButtonText: 'Fechar'
  });
})


//FUnção que retorna um caminho para um polígono com base em seus vértices
function polygonPath(vertices) { 
    const path = new Path2D();
    path.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
        path.lineTo(vertices[i].x, vertices[i].y);
    }
    path.closePath();
    return path;
}
