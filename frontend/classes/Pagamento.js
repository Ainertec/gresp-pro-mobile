// --------------------------------------------- Classe pagamento -----------------------------------------------------

//funcao responsavel por fazer a ligação necessaria com a tela de pagamento
function ligacaoPagamentoFacede(tipo) {
    const situacao = autenticacaoLogin()

    if (JSON.parse(situacao).tipo == 'Administrador' || JSON.parse(situacao).tipo == 'Comum') {
        if (tipo == 'digitar') {
            telaPagamento();
        } else if (tipo == 'qrcode') {
            telaLeituraDeQrCodePagamento();
        } else {
            telaExibirTodosOsPedidosPagamento();
        }
    } else {
        mensagemDeErro('Usuário não autorizado!')
        if (tipo == 'lista') {
            animacaoSlideDown(['#janela2'])
            telaAutenticacao()
        }
    }
}

//funcao tela de pagamento
function telaPagamento(identificacao) {
    let codigoHTML = ``;

    codigoHTML += `<h4 class="text-center"><span class="fas fa-donate"></span> Buscar pedido</h4>
        <div class="card-deck col-8 mx-auto d-block">
            <div class="input-group mb-3">`
    if (identificacao == null) {
        codigoHTML += `<input id="identificacao" type="Number" class="form-control mousetrap" placeholder="Número do pedido">
            <button onclick="if(validaDadosCampo(['#identificacao'])){buscarDadosDoPedidoParaPagamento();}else{mensagemDeErro('Preencha o número do pedido!'); mostrarCamposIncorrreto(['identificacao']);}" type="button" class="btn btn-outline-info">
                <span class="fas fa-search"></span> Buscar Pedido
            </button>`
    } else {
        codigoHTML += `<input id="identificacao" type="Number" class="form-control mousetrap" value=${identificacao}>
            <button onclick="if(validaDadosCampo(['#identificacao'])){buscarDadosDoPedidoParaPagamento();}else{mensagemDeErro('Preencha o número do pedido!'); mostrarCamposIncorrreto(['identificacao']);}" type="button" class="btn btn-outline-info">
                <span class="fas fa-search"></span> Buscar Pedido
            </button>`
        setTimeout(function () { buscarDadosDoPedidoParaPagamento(); }, 300);
    }
    codigoHTML += `</div>
        </div>
        <div id="resposta" style="margin-top:50px" class="col-10 rounded mx-auto d-block"></div>`

    document.getElementById('janela2').innerHTML = codigoHTML;
}

//funcao para gerar tela de leitura de qrCode
function telaLeituraDeQrCodePagamento() {
    let codigoHTML = ``;

    codigoHTML = `<h4 class="text-center"><span class="fas fa-qrcode"></span> Leitura QR Code</h4>
        <video id="preview" class="mx-auto d-block" style="margin-top:30px; background-color:#000; width:40vw; height:30vw; border-radius:30px;"></video>
        <button onclick="telaLeituraDeQrCodePedido();" class="btn btn-outline-secondary rounded mx-auto d-block" style="margin-top:15px">
            <span class="fas fa-sync"></span> Atualizar
        </button>`

    document.getElementById('janela2').innerHTML = codigoHTML;

    let scanner = new Instascan.Scanner(
        {
            video: document.getElementById('preview')
        }
    );
    scanner.addListener('scan', function (content) {
        telaPagamento(content);
        setTimeout(function () { scanner.stop(); }, 3000);
    });
    Instascan.Camera.getCameras().then(cameras => {
        if (cameras.length > 0) {
            scanner.start(cameras[0]);
        } else {
            mensagemDeErro("Não existe câmera no dispositivo!");
        }
    });
    setTimeout(function () { scanner.stop(); }, 10000);
}

//funcao para exibir lista com todos os pedidos
async function telaExibirTodosOsPedidosPagamento() {

    await aguardeCarregamento(true)
    let codigoHTML = ``, json = await requisicaoGET("orders", { headers: { Authorization: `Bearer ${buscarSessionUser().token}` } });
    await aguardeCarregamento(false)

    codigoHTML += `<h4 class="text-center" style="margin-top:30px"><span class="fas fa-clipboard-list"></span> Lista de Pedidos</h4>
        <table class="table table-light col-10 mx-auto table-sm text-center" style="margin-top:50px">
            <thead class="thead-dark">
                <tr>
                    <th scope="col">Número</th>
                    <th scope="col">Valor Total</th>
                    <th scope="col">Data</th>
                    <th scope="col">#</th>
                </tr>
            </thead>
            <tbody>`

    for (let item of json.data) {
        codigoHTML += `<tr>
                    <td class="table-info"><strong>${item.identification}</strong></td>
                    <td class="table-warning text-danger"><strong>R$${item.total.toFixed(2)}</strong></td>
                    <td class="table-warning"><strong>${(item.updatedAt).split('.')[0]}</strong></td>
                    <td><button class="btn btn-primary btn-sm" onclick="telaPagamento(this.value)" value="${item.identification}"><span class="fas fa-check"></span> Abrir</button></td>
                </tr>`
    }
    codigoHTML += `</tbody>
    </table>`

    if (json.data[0] == null) {
        document.getElementById('janela2').innerHTML = `<h5 class="text-center" style="margin-top:40vh;"><span class="fas fa-exclamation-triangle"></span> Não existe pedido em aberto!</h5>`;
        setTimeout(function () { animacaoJanela2(); setTimeout(function () { menuPagamentoPedido(); }, 100); }, 2000)
    } else {
        document.getElementById('janela2').innerHTML = codigoHTML;
    }

    animacaoSlideDown(['#janela2']);
}

//funcao para gerar tela de resposta contendo todos os itens produtos e bebidas
async function buscarDadosDoPedidoParaPagamento() {

    var codigoHTML = ``;
    await aguardeCarregamento(true)
    var json = await requisicaoGET("orders/" + $('#identificacao').val(), { headers: { Authorization: `Bearer ${buscarSessionUser().token}` } });
    await aguardeCarregamento(false)

    if (json.data == null) {
        mensagemDeErro("Pedido inexistente!");
        setTimeout(function () { menuPagamentoPedido(); }, 1000)
    } else {

        document.getElementById('resposta').innerHTML = "";

        codigoHTML += `<div class="col-12 rounded mx-auto" id="escondeDados1" style="margin-top: 10px;">
                <h3>Valor total: <span class="badge badge-success"> R$ ${(json.data.total).toFixed(2)}</span></h3>
                <hr class="my-6 bg-dark">
            </div>
            <h5 class="text-center" style="margin-top:15px">Itens do pedido</h5>
            <div class="col-12 layer1" style="position: relative; height: 35vh; z-index: 1; overflow: scroll; margin-right: 0px; padding: 5px">
                <table class="table table-light table-sm">
                    <thead class="thead-dark">
                        <tr>
                            <th scope="col">Nome</th>
                            <th scope="col">Preço</th>
                            <th scope="col">Quantidade</th>
                            <th scope="col">Total</th>
                        </tr>
                    </thead>
                    <tbody>`
        try {
            for (let item of json.data.items) {
                codigoHTML += '<tr scope="row">'
                if (item.product.drink) {
                    codigoHTML += `<td class="table-info" title="${item.product.name}"><strong><span class="fas fa-wine-glass-alt"></span> ${corrigirTamanhoString(40, item.product.name)}</strong></td>`
                } else {
                    codigoHTML += `<td class="table-info" title="${item.product.name}"><strong><span class="fas fa-utensils"></span> ${corrigirTamanhoString(40, item.product.name)}</strong></td>`
                }
                codigoHTML += `<td class="table-warning"><strong>R$ ${(parseFloat(item.product.price)).toFixed(2)}</strong></td>
                                <td class="table-warning text-center"><strong>${parseInt(item.quantity)}</strong></td>
                                <td class="table-warning text-danger"><strong>R$ ${(parseFloat(item.product.price) * parseInt(item.quantity)).toFixed(2)}</strong></td>
                            </tr>`
            }
        } catch (Exception) {
            mensagemDeErro('Não foi possível carregar os itens!')
        }
        codigoHTML += `</tbody>
            </table>
        </div>
        <div class="card-deck col-8 mx-auto d-block">
            <div class="input-group mb-3" style="margin-top:20px">
                <select class="custom-select" id="formaPagamento">
                    <option selected value="dinheiro">Dinheiro</option>
                    <option value="cartão">Cartão</option>
                </select>
                <div class="input-group-append">
                    <button onclick="if(validaDadosCampo(['#identificacao'])){confirmarAcao('Efetuar o pagamento deste pedido!','efetuarPagamento()',null)}else{mensagemDeErro('Preencha o número do pedido!')}" type="button" class="btn btn-primary">
                        <span class="fas fa-hand-holding-usd"></span> Efetuar Pagamento
                    </button>
                </div>
            </div>
        </div>`


        animacaoSlideUp(['#resposta']);
        setTimeout(function () {
            document.getElementById('resposta').innerHTML = codigoHTML;
            animacaoSlideDown(['#resposta'])
        }, 400)
    }
}

//funcao para efetuar o pagamento
async function efetuarPagamento() {
    try {
        await aguardeCarregamento(true)
        await requisicaoDELETE("orders/" + $('#identificacao').val() + "/" + $('#formaPagamento').val(), '', { headers: { Authorization: `Bearer ${buscarSessionUser().token}` } });
        await aguardeCarregamento(false)
        await mensagemDeAviso("Pagamento Efetuado!");
        await setTimeout(function () { menuPagamentoPedido(); }, 500)
    } catch (error) {
        mensagemDeErro('Não foi possível efetuar o pagamento!')
    }
}