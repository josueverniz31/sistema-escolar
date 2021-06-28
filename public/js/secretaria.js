var secretariaRef = firebase.database().ref('sistemaEscolar/secretaria')
var numerosRef = firebase.database().ref('sistemaEscolar/numeros')
var aniversariosRef = firebase.database().ref('sistemaEscolar/aniversarios')
var listaDeUsuariosRef = firebase.database().ref('sistemaEscolar/listaDeUsuarios')
var listaDeProfessores = firebase.database().ref('sistemaEscolar/listaDeProfessores')
var turmasRef = firebase.database().ref('sistemaEscolar/turmas')
var ultimaMatriculaRef = firebase.database().ref('sistemaEscolar/ultimaMatricula')
var alunosRef = firebase.database().ref('sistemaEscolar/alunos')
var followUpRef = firebase.database().ref('sistemaEscolar/followUp')
var transfereAlunos = firebase.functions().httpsCallable('transfereAlunos')
var desempenhoRef = firebase.database().ref('sistemaEscolar/notasDesempenho/referencia')
var infoEscolaRef = firebase.database().ref('sistemaEscolar/infoEscola')
var alunosStorageRef = firebase.storage().ref('sistemaEscolar/alunos')

var loader = document.getElementById('loader')
var loaderMsg = document.getElementById('loaderMsg')

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  })

  $(function () {
    $('[data-toggle="popover"]').popover()
  })



firebase.auth().onAuthStateChanged((user) => {
    
    if (user == null) {
        loaderRun()
        
        abrirModal('modal', 'Login',
            `
                <h3>Seja bem-vindo!</h3>
                <h6>Para acessar o sistema, digite seu e-mail e sua senha cadastradas.</h6>
                <form id="areaLogin">
                    <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="inputEmail4">Email</label>
                        <input type="email" name="usuario" class="form-control" id="usuario" placeholder="Email">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="inputPassword4">Senha</label>
                        <input type="password" name="senha" class="form-control" id="inputPassword4" placeholder="Senha">
                    </div>
                    <button type="submit" class="btn btn-primary btn-block" id="btnEntrar">Entrar no sistema</button>
                </form>
                <br><br>
                <a href="#" id="esqueceuSenha" class="text-center" data-toggle="tooltip" data-placement="right" title="Digite seu e-mail no campo, e clique aqui para que possamos te ajudar.">Esqueci minha senha</a>
                <p class="text-muted">Caso tenha esquecido sua senha, informe seu e-mail no campo acima e clique em "Esqueci minha senha" para que possamos ajudá-lo.</p>
            `,
            `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
        )
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
    
        document.querySelector('#areaLogin').addEventListener('submit', (e) => {
            loaderRun(true, 'Conectando ao sistema...')
            e.preventDefault()
            const formData = new FormData(e.target);
            var senha = formData.get('senha')
            var email = formData.get('usuario')
            firebase.auth().useDeviceLanguage();

            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
                .then(() => {
                    loaderRun(true, 'Autenticando usuário...')
                    // Existing and future Auth states are now persisted in the current
                    // session only. Closing the window would clear any existing state even
                    // if a user forgets to sign out.
                    // ...
                    // New sign-in will be persisted with session persistence.
                    return firebase.auth().signInWithEmailAndPassword(email, senha);
                }).then((result) => {
                    loaderRun()
                    $('#modal').modal('hide')
                })
                .catch((error) => {
                    // Handle Errors here.
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    AstNotif.dialog('Erro', error.message)
                    loaderRun()
                });

        })
    } else {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Buscando informações do usuário...'
        try {
            document.getElementById('username').innerHTML = "Olá,<br>" + user.displayName.split(' ')[0]
            if (user.photoURL != null) {
                document.getElementById('profilePic').src = user.photoURL
                
            } 
        } catch (error) {
            console.log(error)
        }
        //var alunosCadastradosNum = document.getElementById('alunosCadastradosNum')
        var alunosMatriculadosNum = document.getElementById('alunosMatriculadosNum')
        var alunosDesativadosNum = document.getElementById('alunosDesativadosNum')
        var turmasCadastradasNum = document.getElementById('turmasCadastradasNum')
        alunosRef.on('value', (snapshot) => {
            let students = snapshot.val()
            let c = 0
            for (const matricula in students) {
                if (Object.hasOwnProperty.call(students, matricula)) {
                    const dados = students[matricula];
                    c++
                }
            }
            alunosMatriculadosNum.innerText = c
        })
        turmasRef.on('value', (snapshot) => {
            let classrooms = snapshot.val()
            let c = 0
            for (const matricula in classrooms) {
                if (Object.hasOwnProperty.call(classrooms, matricula)) {
                    const dados = classrooms[matricula];
                    c++
                }
            }
            turmasCadastradasNum.innerText = c
        })
        firebase.database().ref('sistemaEscolar/alunosDesativados').on('value', (snapshot) => {
            let inactiveStudents = snapshot.val()
            let c = 0
            for (const matricula in inactiveStudents) {
                if (Object.hasOwnProperty.call(inactiveStudents, matricula)) {
                    const dados = inactiveStudents[matricula];
                    c++
                }
            }
            alunosDesativadosNum.innerText = c
        })
        numerosRef.on('value', (snapshot) => {
            loaderMsg.innerText = 'Buscando informações da dashboard'
            var numeros = snapshot.val()
            var tabelaSemanal = numeros.tabelaSemanal
            
            //alunosCadastradosNum.innerText = numeros.alunosCadastrados != undefined ? numeros.alunosCadastrados : 0
            
            //alunosDesativadosNum.innerText = numeros.alunosDesativados != undefined ? numeros.alunosDesativados : 0
            //turmasCadastradasNum.innerText = numeros.turmasCadastradas != undefined ? numeros.turmasCadastradas : 0

            // Alimenta tabela com os números de alunos em cada semana
            var idCelulaTabela = ''
            var totalManha = document.getElementById('totalManha').innerText = 0
            var totalTarde = document.getElementById('totalTarde').innerText = 0
            var totalNoite = document.getElementById('totalNoite').innerText = 0
            var totalMON = document.getElementById('totalMON').innerText = 0
            var totalTUE = document.getElementById('totalTUE').innerText = 0
            var totalWED = document.getElementById('totalWED').innerText = 0
            var totalTHU = document.getElementById('totalTHU').innerText = 0
            var totalFRI = document.getElementById('totalFRI').innerText = 0
            var totalSAT = document.getElementById('totalSAT').innerText = 0
            var totalSUN = document.getElementById('totalSUN').innerText = 0
            for (const dia in tabelaSemanal) {
                if (tabelaSemanal.hasOwnProperty(dia)) {
                    const horarios = tabelaSemanal[dia];
                    idCelulaTabela += dia
                    for (const horario in horarios) {
                        if (horarios.hasOwnProperty(horario)) {
                            const numeroDeAlunos = horarios[horario]
                            idCelulaTabela += horario
                            console.log(idCelulaTabela)
                            document.getElementById(idCelulaTabela).innerText = numeroDeAlunos
                            var numNaTabela = Number(document.getElementById('total' + horario).innerText)
                            numNaTabela += numeroDeAlunos
                            var numNaTabelaDiario = Number(document.getElementById('total' + dia).innerText)
                            numNaTabelaDiario += numeroDeAlunos
                            document.getElementById('total' + horario).innerText = numNaTabela
                            document.getElementById('total' + dia).innerText = numNaTabelaDiario
                            idCelulaTabela = dia
                        }
                    }
                    idCelulaTabela = ''
                }
            }
            loaderRun()
        })

        aniversariosRef.on('value', snapshot => {
            loader.style.display = 'block'
            var meses = snapshot.val()
            var dataLocal = new Date()
            var mesAtual = dataLocal.getMonth()
            document.getElementById('listaAniversarios').innerHTML = ''
            for (const key in meses[mesAtual]) {
                if (meses[mesAtual].hasOwnProperty(key)) {
                    const aniversario = meses[mesAtual][key];
                    document.getElementById('listaAniversarios').innerHTML += `<button class="list-group-item list-group-item-action">${aniversario.nome} no dia ${aniversario.dataNascimento.dia}</button>`
                }
            }
            loaderRun()
        })
    }
    
})

// Funções para cadastro de turmas



function preparaCadastroTurma() {
    let codTurmaAdd = document.getElementById('codTurmaAdd')

    let codDiasSemana
    let cursosCadastrados
    let livrosCadastrados

    let codCurso
    let horario
    let dias = []
    let livros = [] 

    function geraCod() {
        let codTurma = ''
        if (codCurso != undefined) {
            codTurma += codCurso
        }
        for (const i in livros) {
            if (Object.hasOwnProperty.call(livros, i)) {
                const codLivro = livros[i];
                codTurma += codLivro
            }
        }
        codTurma += '-'
        for (const i in dias) {
            if (Object.hasOwnProperty.call(dias, i)) {
                const dia = dias[i];
                codTurma += dia
            }
        }
        if (horario != undefined) {
            codTurma += horario
        }

        codTurmaAdd.value = codTurma
        console.log(codTurma)
    }

    infoEscolaRef.child('codDiasSemana').on('value', (snapshot) => {
        codDiasSemana = snapshot.val()
    })

    infoEscolaRef.child('livros').on('value', (snapshot) => {
        let listaLivros = document.getElementById('listaLivrosTurma')
        listaLivros.innerHTML = ''
        livrosCadastrados = snapshot.val()
        for (const i in livrosCadastrados) {
            if (Object.hasOwnProperty.call(livrosCadastrados, i)) {
                const livro = livrosCadastrados[i];
                listaLivros.innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                                <input type="checkbox" id="checkbox${livro.codSistema}" name="livros" value="${livro.codSistema}">
                                <label for="checkbox${livro.codSistema}"></label>
                            </span>
                        </td>
                        <td>${livro.nomeLivro}</td>
                        <td>${livro.codLivro}</td>
                        <td>${livro.idLivro}</td>
                    </tr>
                `
            }
        }
        document.getElementsByName('livros').forEach(livro => {
            livro.addEventListener('input', (e) => {
                if (e.target.checked) {
                    livros.push(livrosCadastrados[Number(e.target.value)].codLivro)
                } else {
                    livros.splice(livros.indexOf(livrosCadastrados[Number(e.target.value)].codLivro), 1)
                }
                geraCod()
                console.log(livros)
            })
        })
    })

    infoEscolaRef.child('cursos').on('value', (snapshot) => {
        let listaCursos = document.getElementById('listaCursosTurma')
        listaCursos.innerHTML = '<option hidden selected>Escolha um curso...</option>'
        cursosCadastrados = snapshot.val()
        for (const i in cursosCadastrados) {
            if (Object.hasOwnProperty.call(cursosCadastrados, i)) {
                const curso = cursosCadastrados[i];
                listaCursos.innerHTML += `
                <option value="${curso.codSistema}">${curso.codCurso} - ${curso.nomeCurso}</option>
                `
            }
        }
    })

    listaDeProfessores.on('value', (snapshot) => {
        let listaProfessoresTurma = document.getElementById('listaProfessoresTurma')
        listaProfessoresTurma.innerHTML = '<option hidden selected>Escolha um professor...</option>'
        for (const key in snapshot.val()) {
            if (Object.hasOwnProperty.call(snapshot.val(), key)) {
                const professor = snapshot.val()[key];
                listaProfessoresTurma.innerHTML += `
                <option value="${professor.nome}|${professor.email}">${professor.nome} (${professor.email})</option>
                `
            }
        }
    })

    document.getElementById('listaCursosTurma').addEventListener('input', (e) => {
        codCurso = cursosCadastrados[e.target.value].codCurso
        geraCod()
        console.log(codCurso)
    })

    document.getElementsByName('dia').forEach(dia => {
        dia.addEventListener('click', (e) => {
            if (e.target.checked) {
                dias.push(codDiasSemana[Number(e.target.value)])
            } else {
                dias.splice(dias.indexOf(codDiasSemana[Number(e.target.value)]), 1)
            }
            geraCod()
            console.log(dias)
        })
    });

    

    document.getElementById('horarioTurma').addEventListener('input', (e) => {
        if (e.target.value.split(':')[1] == '00') {
            horario = e.target.value.split(':')[0]
        } else {
            horario = e.target.value.split(':').join('_')
        }
        geraCod()
        console.log(horario)
    })

    document.getElementById('formCadastroTurma').addEventListener('submit', (e) => {
        e.preventDefault()
        loaderRun(true, 'Enviando dados da turma para o servidor...')
        const dados = new FormData(e.target)
        let dadosTurma = {}
        dadosTurma.codigoSala = dados.get('codTurmaAdd')
        dadosTurma.professor = dados.get('listaProfessoresTurma').split('|')[1]
        console.log(dadosTurma.professor)
        dadosTurma.diasDaSemana = dados.getAll('dia')
        dadosTurma.livros = dados.getAll('livros')
        dadosTurma.curso = dados.get('listaCursosTurma')
        if (dados.get('horarioTurma').split(':')[1] == '00') {
            horario = dados.get('horarioTurma').split(':')[0]
        } else {
            horario = dados.get('horarioTurma').split(':').join('_')
        }
        dadosTurma.hora = horario
        
        var cadastraTurma = firebase.functions().httpsCallable('cadastraTurma')
        cadastraTurma(dadosTurma).then(function(result) {
            console.log(result)
            AstNotif.dialog('Sucesso', result.data.answer)
            loaderRun()
        }).catch(function(error) {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
            loaderRun()
        })
    })
}







var turmas
// Funções da aba de turmas da secretaria
function carregaTurmas() {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando informações das turmas...'
    var selectTurmas = document.getElementById('selectTurmas')
    turmasRef.once('value').then(snapshot => {
        selectTurmas.innerHTML = '<option selected hidden>Escolha uma turma...</option>'
        turmas = snapshot.val()
        let selected = false
        for (const cod in turmas) {
            if (Object.hasOwnProperty.call(turmas, cod)) {
                const infoDaTurma = turmas[cod];
                if (infoDaTurma.professor == undefined) {
                    var profReferencia = 'Não cadastrado'
                } else {
                    var profReferencia = infoDaTurma.professor[0].nome
                }
                if (alunosSelecionadosTurma.codTurma != undefined) {
                    selected = 'selected'
                } else {
                    selected = false
                }
                selectTurmas.innerHTML += `<option ${selected} value="${cod}">Turma ${cod} (Prof. ${profReferencia})</option>`
            }
        }
        document.getElementById('selectTurmas').style.visibility = 'visible'
        loaderRun()
    }).catch(error => {
        loaderRun()
        console.error(error)
        AstNotif.dialog('Erro', error.message)
    })
}

var alunosSelecionadosTurma = {}
document.getElementById('btnTransfereAlunosTurma').addEventListener('click', transfereAlunosConfirma)
function transfereAlunosConfirma() {
    let nomes = ''
    let turma
    for (const matricula in alunosSelecionadosTurma) {
        if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
            const aluno = alunosSelecionadosTurma[matricula];
            if (matricula == 'codTurma') {
                turma = aluno
            } else if(matricula == undefined || aluno == undefined) {

            } else {
                nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
            }
            
        }
    }
    abrirModal('modal', 'Confirmação', 
        `Você selecionou os alunos listados abaixo da turma ${turma}. <br> ${nomes} <br><b>Você deseja transferi-los para qual turma?</b><br>(Aviso: Caso o professor da turma que se quer transferir seja diferente, as notas e todas outras informações que foram feitas pelo professor atual serão transferidas também.)
        <select class="custom-select" id="selectTurmasTransfere">
            <option selected hidden>Escolha uma turma...</option>
        </select>
        `
        , `<button type="button" data-toggle="tooltip" data-placement="top" title="A operação de transferência ficará gravada no sistema para futuras consultas." class="btn btn-info" onclick="transfereDaTurma()">Transferir</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
    )
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
      })
    let selectTurmasTransfere = document.getElementById('selectTurmasTransfere')
    for (const cod in turmas) {
        if (Object.hasOwnProperty.call(turmas, cod)) {
            const infoDaTurma = turmas[cod];
            if (infoDaTurma.professor == undefined) {
                var profReferencia = 'Não cadastrado'
            } else {
                var profReferencia = infoDaTurma.professor[0].nome
            }
            selectTurmasTransfere.innerHTML += `<option value="${cod}">Turma ${cod} (Prof. ${profReferencia})</option>`
        }
    }
}

function selecionaTodos(source) {
    let checkboxes = document.getElementsByName('alunosTurma');
    for(var i=0, n=checkboxes.length;i<n;i++) {
        if (source.checked) {
            checkboxes[i].checked = false;
            checkboxes[i].click()
        } else {
            checkboxes[i].checked = true;
            checkboxes[i].click()
        }
        
    }
    
}



function excluirTurma(confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Excluindo turma...'
        let excluiTurma = firebase.functions().httpsCallable('excluiTurma')
        excluiTurma({codTurma: alunosSelecionadosTurma.codTurma}).then(function(result) {
            AstNotif.dialog('Sucesso', result.data.answer)
            carregaTurmas()
            loaderRun()
        }).catch(function(error) {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
            loaderRun()
        })
    } else {
        if (alunos == null) {
            abrirModal('modal', 'Confirmação', 'Você está prestes à excluir uma turma. Ao excluir uma turma, todo o histórico gravado da turma será excluído! Depois de excluída, você poderá criar uma nova turma com o mesmo ID. Esta ação não pode ser revertida. <br><br> <b>Você têm certeza que deseja excluir esta turma?</b>', '<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button><button type="button" class="btn btn-danger" data-dismiss="modal" onclick="excluirTurma(true)">Excluir</button>')
        } else {
            abrirModal('modal', 'Calma aí', 'Você não pode excluir uma turma com alunos cadastrados nela. Antes de excluir a turma, transfira os alunos para outra turma, ou desative os alunos.', '<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>')
        } 
    }
}
function transfereDaTurma() {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Transferindo alunos...'
    let selectTurmasTransfere = document.getElementById('selectTurmasTransfere')
    alunosSelecionadosTurma.codTurmaParaTransferir = selectTurmasTransfere.value
    if (alunosSelecionadosTurma.codTurma == alunosSelecionadosTurma.codTurmaParaTransferir) {
        AstNotif.dialog('Erro', 'Você deve escolher uma turma diferente da atual para transferência dos alunos.')
        loaderRun()
    } else {
        console.log(alunosSelecionadosTurma)
        transfereAlunos(alunosSelecionadosTurma).then(function(result){
            AstNotif.dialog('Sucesso', result.data.answer)
            loaderRun()
            alunosSelecionadosTurma = {}
            carregaTurmas()
            $('#modal').modal('hide')
            document.getElementById('listaAlunosDaTurma').innerHTML = ''
            document.getElementById('ulProfCadastrados').innerHTML = ''
        }).catch(function(error){
            AstNotif.dialog('Erro', error.message)
            console.error(error)
            loaderRun()
        })
    }
}
var alunos
function carregaListaDeAlunosDaTurma(turma, filtro='') {
    
    tipoDeBusca = 'nome'
    alunosSelecionadosTurma = {}
    alunosSelecionadosTurma.codTurma = turma
    console.log(filtro)
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando lista de alunos...'
    let listaAlunos = document.getElementById('listaAlunos')
    if (filtro == '') {
        document.getElementById('listaAlunosDaTurma').innerHTML = ''
        turmasRef.child(turma + '/alunos').once('value').then(snapshot => {
            alunos = snapshot.val()
            for (const matricula in alunos) {
                if (Object.hasOwnProperty.call(alunos, matricula)) {
                    const aluno = alunos[matricula];
                    document.getElementById('listaAlunosDaTurma').innerHTML += `<div class="row"><div class="col-1" ><br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="checkbox" name="alunosTurma" onclick="this.checked ? alunosSelecionadosTurma[${matricula}] = '${aluno.nome}' : delete alunosSelecionadosTurma[${matricula}], verificaAlunosSelecionados()"></div><div class="col-md"><button class="list-group-item list-group-item-action" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}'), setTimeout( function() {document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block', document.getElementById('rolaTelaAbaixoAlunos').focus(), document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'}, 300 ); "> ${matricula}: ${aluno.nome}</button></div></div>`
                }
                
            }
            loaderRun()
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    } else {
        document.getElementById('listaAlunosDaTurma').innerHTML = ''
        turmasRef.child(turma + '/alunos').orderByChild('nome').equalTo(filtro).once('value').then(snapshot => {
            alunos = snapshot.val()
            for (const matricula in alunos) {
                if (Object.hasOwnProperty.call(alunos, matricula)) {
                    const aluno = alunos[matricula];
                    document.getElementById('listaAlunosDaTurma').innerHTML += `<div class="row"><div class="col-sm-1"><input type="checkbox" name="alunosTurma" onclick="this.checked ? alunosSelecionadosTurma[${matricula}] = '${aluno.nome}' : delete alunosSelecionadosTurma[${matricula}], verificaAlunosSelecionados()"></div><div class="col-md"><button class="list-group-item list-group-item-action" onclick="document.getElementById('btnAbaAlunos').click(), document.getElementById('btnAbaAlunosResponsivo').click(), abreDadosDoAluno('${matricula}') "> ${matricula}: ${aluno.nome}</button></div></div>`
                }
            }
            loaderRun()
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    }
    
}

function verificaAlunosSelecionados() {
    let c = 0
    for (const matricula in alunosSelecionadosTurma) {
        if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
            const nome = alunosSelecionadosTurma[matricula];
            
            if (matricula == 'codTurma') {
                
            } else if (nome != "") {
                c++
            }
            console.log(c)
            if (c == 0) {
                document.getElementById('btnTransfereAlunosTurma').disabled = true
                document.getElementById('btnDesativaAlunos').disabled = true
                document.getElementById('selecTodos').checked = false
            } else {
                document.getElementById('btnTransfereAlunosTurma').disabled = false
                document.getElementById('btnDesativaAlunos').disabled = false
            }
        }
    }
    
}

function abreTurma(cod) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Abrindo turma...'
    carregaListaDeAlunosDaTurma(cod)
    var codigoDaTurmaLabel = document.getElementById('codigoDaTurma')
    var areaInfoTurma = document.getElementById('areaInfoTurma')
    turmasRef.child(cod).on('value', (snapshot) => {
        // TODO: Mostrar na tela as informações da turma
        console.log(snapshot.val())
        let dadosDaTurma = snapshot.val()
        codigoDaTurmaLabel.innerText = dadosDaTurma.codigoSala
        areaInfoTurma.style.visibility = 'visible'
        infoEscolaRef.once('value').then(infoEscola => {
            let livros = infoEscola.val().livros
            let codDiasSemana = infoEscola.val().codDiasSemana
            document.getElementById('mostraDiasTurma').innerText = 'Dia(s) de Aula:'
            for (const key in dadosDaTurma.diasDaSemana) {
                if (Object.hasOwnProperty.call(dadosDaTurma.diasDaSemana, key)) {
                    const dia = dadosDaTurma.diasDaSemana[key];
                    let diasemana
                    switch(Number(dia)) {
                        case 0:
                            diasemana = 'Domingo'
                            break
                        case 1:
                            diasemana = 'Segunda'
                            break
                        case 2: 
                            diasemana = 'Terça'
                            break
                        case 3:
                            diasemana = 'Quarta'
                            break
                        case 4:
                            diasemana = 'Quinta'
                            break
                        case 5:
                            diasemana = 'Sexta'
                            break
                        case 6:
                            diasemana = 'Sábado'
                            break
                        default:
                            diasemana = ''
                            break
                    }
                    document.getElementById('mostraDiasTurma').innerText += ' | ' + diasemana + ' '
                }
                
            }

            document.getElementById('mostraLivrosTurma').innerText = 'Livros cadastrados: '
            for (const key in dadosDaTurma.livros) {
                if (Object.hasOwnProperty.call(dadosDaTurma.livros, key)) {
                    const numLivro = dadosDaTurma.livros[key];
                    document.getElementById('mostraLivrosTurma').innerText += ` | ${livros[numLivro].idLivro} `
                }
            }
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        // Mostra dias de aula da turma
        
        document.getElementById('mostraHorarioTurma').innerText = 'Horário de aula: '+ dadosDaTurma.hora + 'h'
        
        

        document.getElementById('timestampTurmaCadastrada').innerText = 'Turma cadastrada em:  ' + new Date(dadosDaTurma.timestamp._seconds * 1000)

        document.getElementById('mostraProfessoresCadastrados').innerHTML = `<button class="btn btn-primary" onclick="modalAddProfTurma('${cod}')"><span data-feather="user-plus"></span> Adicionar professores</button><ul class="items" id="ulProfCadastrados"></ul>`
        for (const key in dadosDaTurma.professor) {
            if (Object.hasOwnProperty.call(dadosDaTurma.professor, key)) {
                const professor = dadosDaTurma.professor[key];
                document.getElementById('ulProfCadastrados').innerHTML += `
                    <li class="item-dismissible">${professor.nome} (${professor.email})<span class="close" data-toggle="tooltip" data-placement="top" title="Retirar prof. desta turma?" onclick="retiraProf('${professor.email}', '${professor.nome}', '${dadosDaTurma.codigoSala}')">&times;</span></li>
                `
            }
        }
        loaderRun()
        
    })
}

function retiraProf(email, nome, codSala, confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Removendo professor da turma...'
        document.getElementById('ast-dialog-bg').remove()
        turmasRef.child(codSala).child('professor').once('value', (snapshot) => {
            let listaProf = snapshot.val()
            console.log(listaProf)
            for (const key in listaProf) {
                if (Object.hasOwnProperty.call(listaProf, key)) {
                    const professor = listaProf[key];
                    if (professor.email == email) {
                        listaProf.splice(key, 1)
                        console.log(listaProf)
                    }
                }
            }
            turmasRef.child(codSala).child('professor').set(listaProf).then(() => {
                loaderRun()
                AstNotif.notify('Sucesso', 'Professor deletado com sucesso')
            })

        })
    } else {
        AstNotif.dialog('Confirmação', `Você está prestes à retirar o acesso desta turma de ${nome} (${email}). Você confirma esta ação?<br><br> <button type="button" class="btn btn-danger" onclick="retiraProf('${email}', '${nome}', '${codSala}', true)">Sim, confirmo</button>`, {positive: 'Voltar', negative: ''})
    }
}

function modalAddProfTurma(codSala) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Aguarde...'
    AstNotif.dialog('Adicionar professores nesta turma', `
    Por favor, tenha o cuidado de escolher um(a) professor(a) que ainda não está vinculado na turma atual.
    <div class="input-group prepend">
        <div class="input-group-prepend">
        <label class="input-group-text" for="inputGroupSelect01">Prof.</label>
        </div>
        <select class="custom-select" id="selectAddProfessorTurma" onchange="novoProf(this.value, '${codSala}')">
        <option selected hidden>Escolha o(a) professor(a)...</option>
        
        </select>
    </div>
    `, {positive: 'Voltar', negative: ''})
    listaDeProfessores.once('value', (snapshot) => {
        let listaProf = snapshot.val()
        console.log(listaProf)
        for (const key in listaProf) {
            if (Object.hasOwnProperty.call(listaProf, key)) {
                const professor = listaProf[key];
                document.getElementById('selectAddProfessorTurma').innerHTML += `<option value="${professor.email}">${professor.nome} (${professor.email})</option>`
            }
        }
        loaderRun()
    })
    
}

function novoProf(email, codSala) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Adicionando professor na turma...'
    document.getElementById('ast-dialog-bg').remove()
    var addNovoProfTurma = firebase.functions().httpsCallable('addNovoProfTurma')
    addNovoProfTurma({emailProf: email, codSala: codSala})
    .then(function(result) {
        console.log(result)
        AstNotif.dialog('Sucesso', result.data.answer)
        loaderRun()
    }).catch(function(error) {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
}

function preencheEndereco(numCep) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando enderenço com o CEP...'
    let enderecoAluno = document.getElementById('enderecoAluno')
    let bairroAluno = document.getElementById('bairroAluno')
    let cidadeAluno = document.getElementById('cidadeAluno')
    let cepAluno = document.getElementById('cepAluno')
    let estadoAluno = document.getElementById('estadoAluno')
    getAddress(numCep).then(function(result){
        if (result.street == undefined) {
            AstNotif.dialog('Erro ao buscar CEP', 'Verifique o CEP digitado e tente novamente.')
        } else {
            enderecoAluno.value = result.street
            bairroAluno.value = result.neighborhood
            cidadeAluno.value = result.city
            estadoAluno.value = result.state
            document.getElementById('numeroAluno').focus()
            AstNotif.toast('Dados de endereço preenchidos com sucesso!')
        }
        loaderRun()
        
    }).catch(function(error){
        AstNotif.dialog('Erro ao buscar CEP', error.message)
        console.log(error)
        loaderRun()
    })
}

// Funções do cadastro de alunos
let turmasLocal = {}
function carregaProfsETurmas() {
    turmasLocal = {}
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando dados de matrícula, de turmas e professores...'
    let turmaAluno = document.getElementById('turmaAluno')
    let matriculaAluno = document.getElementById('matriculaAluno')
    
    infoEscolaRef.once('value').then(infoEscola => {
        turmasRef.once('value').then(snapshot => {
            let diasDaSemana = infoEscola.val().codDiasSemana
            let cursos = infoEscola.val().cursos

            turmaAluno.innerHTML = '<option selected hidden>Escolha uma turma...</option>'
            let turmas = snapshot.val()
            turmasLocal = snapshot.val()
            console.log(turmas)
            for (const cod in turmas) {
                if (Object.hasOwnProperty.call(turmas, cod)) {
                    const infoDaTurma = turmas[cod];
                    turmaAluno.innerHTML += `<option value="${cod}">${cod} \(${cursos[infoDaTurma.curso].nomeCurso})</option>`
                }
            }
            loaderRun()
        }).catch(error => {
            loaderRun()
            console.error(error)
            AstNotif.dialog('Erro', error.message)
        })
    }).catch(error => {
        loaderRun()
        console.error(error)
        AstNotif.dialog('Erro', error.message)
    })
    
    ultimaMatriculaRef.once('value').then(snapshot => {
        matriculaAluno.value = Number(snapshot.val()) + 1
        arrumaNumMatricula()
    }).catch(error => {
        loaderRun()
        console.log(error)
        AstNotif.dialog('Erro', error.message)
    })

}

function mostraProfsAlunoESetaTurma(codTurma) {
    if (codTurma != 'Escolha uma turma...') {
        let horaAluno = document.getElementById('horaAluno')
        let nomeProfAluno = document.getElementById('nomeProfAluno')
        let emailProfAluno = document.getElementById('emailProfAluno')
        horaAluno.value = turmasLocal[codTurma].hora + 'h'
        nomeProfAluno.value = turmasLocal[codTurma].professor[0].nome
        emailProfAluno.value = turmasLocal[codTurma].professor[0].email
    }
    
}

function setaRespFinan(num) { 
    let nomeResponsavelFinanceiroAluno = document.getElementById('nomeResponsavelFinanceiroAluno')
    let relacaoFinanceiroAluno = document.getElementById('relacaoFinanceiroAluno')
    let numeroComercialFinanceiroAluno = document.getElementById('numeroComercialFinanceiroAluno')
    let numeroCelularFinanceiroAluno = document.getElementById('numeroCelularFinanceiroAluno')
    let rgResponsavelFinan = document.getElementById('rgFinanceiroAluno')
    let cpfFinanceiroAluno = document.getElementById('cpfFinanceiroAluno')  
    nomeResponsavelFinanceiroAluno.value = document.getElementById('nomeResponsavelAluno' + num).value
    relacaoFinanceiroAluno.value = document.getElementById('relacaoAluno' + num).value
    numeroComercialFinanceiroAluno.value = document.getElementById('numeroComercialResponsavel' + num).value
    numeroCelularFinanceiroAluno.value = document.getElementById('numeroCelularResponsavel' + num).value
    rgResponsavelFinan.value = document.getElementById('rgResponsavel' + num).value
    cpfFinanceiroAluno.value = document.getElementById('cpfResponsavel' + num).value

    document.getElementById('emailResponsavelFinanceiro').focus()
}

function setaRespPedag(num) { 
    let nomeResponsavelFinanceiroAluno = document.getElementById('nomeResponsavelPedagogicoAluno')
    let relacaoFinanceiroAluno = document.getElementById('relacaoPedagogicoAluno')
    let numeroComercialFinanceiroAluno = document.getElementById('numeroComercialPedagogicoAluno')
    let numeroCelularFinanceiroAluno = document.getElementById('numeroCelularPedagogicoAluno')
    let rgResponsavelFinan = document.getElementById('rgPedagogicoAluno')
    let cpfFinanceiroAluno = document.getElementById('cpfPedagogicoAluno')  
    nomeResponsavelFinanceiroAluno.value = document.getElementById('nomeResponsavelAluno' + num).value
    relacaoFinanceiroAluno.value = document.getElementById('relacaoAluno' + num).value
    numeroComercialFinanceiroAluno.value = document.getElementById('numeroComercialResponsavel' + num).value
    numeroCelularFinanceiroAluno.value = document.getElementById('numeroCelularResponsavel' + num).value
    rgResponsavelFinan.value = document.getElementById('rgResponsavel' + num).value
    cpfFinanceiroAluno.value = document.getElementById('cpfResponsavel' + num).value

    document.getElementById('emailResponsavelPedagogico').focus()
}

document.getElementById('matriculaAluno').addEventListener('change', arrumaNumMatricula)
function arrumaNumMatricula() {
    var input = document.getElementById('matriculaAluno');
    
    input.value="00000"+input.value.replace(/\D/g,'');
    input.value=input.value.slice(-5,-1)+input.value.slice(-1);
}

function verificaCPF(strCPF) {
    let cpfAluno = document.getElementById('cpfAluno')
    var Soma;
    var Resto;
    Soma = 0;
  if (strCPF == "00000000000") {
    AstNotif.dialog('CPF inválido.', 'Digite e Verifique as informações de CPF novamente.')
    cpfAluno.value = ''
  } 

  for (i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
  Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10)) ) {
        AstNotif.dialog('CPF inválido.', 'Digite e Verifique as informações de CPF novamente.')
        cpfAluno.value = ''
    } 

  Soma = 0;
    for (i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;

    if ((Resto == 10) || (Resto == 11))  Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11) ) ) {
        AstNotif.dialog('CPF inválido.', 'Digite e Verifique as informações de CPF novamente.')
        cpfAluno.value = ''
    } 
    return true;
}

// JS PDF
function criaPDFAluno() {
    const doc = new jsPDF();

    doc.text("Hello, world!", 10, 10);
    doc.save("a4.pdf");
}

// Esperando o submit para o cadastro efetivo
var idadeAluno
var matriculaPDF = ''
document.querySelector('#formCadastroAluno').addEventListener('submit', (e) => {
    e.preventDefault()
    loader.style.display = 'block'
    loaderMsg.innerText = 'Processando dados...'
    const dados = new FormData(e.target);
    var dadosAluno = {}
    // Dados pessoais
    dadosAluno.matriculaAluno = dados.get('matriculaAluno')
    dadosAluno.nomeAluno = dados.get('nomeAluno')
    dadosAluno.dataNascimentoAluno = dados.get('dataNascimentoAluno')
    dadosAluno.telefoneAluno = dados.get('telefoneAluno')
    dadosAluno.celularAluno = dados.get('celularAluno')
    dadosAluno.emailAluno = dados.get('emailAluno')
    dadosAluno.rgAluno = dados.get('rgAluno')
    dadosAluno.cpfAluno = dados.get('cpfAluno')
    dadosAluno.senhaAluno = dados.get('senhaAluno')
    // Dados para o curso
    dadosAluno.turmaAluno = dados.get('turmaAluno')
    dadosAluno.horaEDiasAluno = dados.get('horaAluno')
    dadosAluno.profAluno = dados.get('emailProfAluno')
    // Dados de endereço
    dadosAluno.cepAluno = dados.get('cepAluno')
    dadosAluno.enderecoAluno = dados.get('enderecoAluno')
    dadosAluno.numeroAluno = dados.get('numeroAluno')
    dadosAluno.bairroAluno = dados.get('bairroAluno')
    dadosAluno.cidadeAluno = dados.get('cidadeAluno')
    dadosAluno.estadoAluno = dados.get('estadoAluno')
    // Dados de Filiação Responsavel 1
    dadosAluno.nomeResponsavelAluno1 = dados.get('nomeResponsavelAluno1')
    dadosAluno.relacaoAluno1 = dados.get('relacaoAluno1')
    dadosAluno.numeroComercialResponsavel1 = dados.get('numeroComercialResponsavel1')
    dadosAluno.numeroCelularResponsavel1 = dados.get('numeroCelularResponsavel1')
    dadosAluno.rgResponsavel1 = dados.get('rgResponsavel1')
    dadosAluno.cpfResponsavel1 = dados.get('cpfResponsavel1')
    // Dados de Filiação responsável 2
    dadosAluno.nomeResponsavelAluno2 = dados.get('nomeResponsavelAluno2')
    dadosAluno.relacaoAluno2 = dados.get('relacaoAluno2')
    dadosAluno.numeroComercialResponsavel2 = dados.get('numeroComercialResponsavel2')
    dadosAluno.numeroCelularResponsavel2 = dados.get('numeroCelularResponsavel2')
    dadosAluno.rgResponsavel2 = dados.get('rgResponsavel2')
    dadosAluno.cpfResponsavel2 = dados.get('cpfResponsavel2')
    // Dados de Filiação Responsável financeiro
    dadosAluno.nomeResponsavelFinanceiroAluno = dados.get('nomeResponsavelFinanceiroAluno')
    dadosAluno.relacaoFinanceiroAluno = dados.get('relacaoFinanceiroAluno')
    dadosAluno.numeroComercialFinanceiroAluno = dados.get('numeroComercialFinanceiroAluno')
    dadosAluno.numeroCelularFinanceiroAluno = dados.get('numeroCelularFinanceiroAluno')
    dadosAluno.rgFinanceiroAluno = dados.get('rgFinanceiroAluno')
    dadosAluno.cpfFinanceiroAluno = dados.get('cpfFinanceiroAluno')
    // Dados de Filiação responsável pedagógico/didático
    dadosAluno.nomeResponsavelPedagogicoAluno = dados.get('nomeResponsavelPedagogicoAluno')
    dadosAluno.relacaoPedagogicoAluno = dados.get('relacaoPedagogicoAluno')
    dadosAluno.numeroComercialPedagogicoAluno = dados.get('numeroComercialPedagogicoAluno')
    dadosAluno.numeroCelularPedagogicoAluno = dados.get('numeroCelularPedagogicoAluno')
    dadosAluno.rgPedagogicoAluno = dados.get('rgPedagogicoAluno')
    dadosAluno.cpfPedagogicoAluno = dados.get('cpfPedagogicoAluno')
    // Gera ou não o PDF do aluno
    dadosAluno.geraPDFAluno = document.getElementById('geraPDFAluno')
    function emailRegularExpression(email) {
        var re = /\S+@\S+\.\S+/
        return re.test(email)
    }

    console.log(dadosAluno)
    if (dadosAluno.dataNascimentoAluno == '' || dadosAluno.nomeAluno == '') {
        AstNotif.dialog('Confira os campos', 'A data de nascimento do aluno e o nome do aluno são obrigatórios.')
        loaderRun()
    } else if((dadosAluno.cpfResponsavel1 == '' || dadosAluno.rgResponsavel1 == '' || dadosAluno.numeroCelularResponsavel1 == '' || dadosAluno.nomeResponsavelAluno1 == '')&& idadeAluno != undefined && idadeAluno.years < 18) {
        AstNotif.dialog('Confira os campos', 'O aluno é menor de idade. É obrigatório o preenchimento dos dados do responsável número 1 do aluno.')
        loaderRun()
    } else if (dadosAluno.emailAluno == '' || emailRegularExpression(dadosAluno.emailAluno) == false) {
        AstNotif.dialog('Confira o email do aluno', 'O email do aluno é obrigatório. Confira se foi escrito corretamente.')
        loaderRun()
    } else if (((dadosAluno.cpfFinanceiroAluno == '' || dadosAluno.numeroCelularFinanceiroAluno == '' || dadosAluno.nomeResponsavelFinanceiroAluno == '') || (dadosAluno.cpfPedgogicoAluno == '' || dadosAluno.numeroCelularPedagogicoAluno == '' || dadosAluno.nomeResponsavelPedagogicoAluno == '')) && idadeAluno.years < 18) {
        AstNotif.dialog('Confira os campos', 'O aluno é menor de idade. Cofira os campos de responsáveis financeiro e pedagógico do aluno, eles são obrigatórios quando o aluno é menor de idade.')
        loaderRun()
    } else if (dadosAluno.cpfAluno == '' || dadosAluno.rgAluno == '') {
        AstNotif.dialog('Confira os campos', 'Os dados de RG e CPF do aluno não podem estar em branco.')
        loaderRun()
    } else if (dadosAluno.turmaAluno == 'Escolha uma turma...') {
        AstNotif.dialog('Confira os campos', 'É obrigatório matricular o aluno em uma turma.')
        loaderRun()
    } else {
        loaderMsg.innerText = 'Enviando dados para o servidor...'
        let cadastraAluno = firebase.functions().httpsCallable('cadastraAluno')
        cadastraAluno({dados: dadosAluno}).then(function(result) {
            loaderRun()
            AstNotif.dialog('Sucesso', result.data.answer)
            if (dadosAluno.geraPDFAluno.checked) {
                document.getElementById('corpoMatricula').innerHTML = `<iframe src="../resources/pdfsProntos/matriculaPdf.html#${dadosAluno.matriculaAluno}" frameborder="0" width="100%" height="max-content" id="fichaPdf" name="fichaPdf"></iframe>`
                $('#matriculaModal').modal({backdrop: 'static'})
            }
            
            document.getElementById('resetForm').click()
            carregaProfsETurmas()
        }).catch(function(error) {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
            loaderRun()
        })
    }
    
})
var diaAtualServidor
function calculaIdade(dataNasc) {
    idadeAluno = 0
    loader.style.display = 'block'
    loaderMsg.innerText = 'Buscando data atual do servidor...'
    console.log(dataNasc)
    let nascimento = dataNasc.split('-')
    let nascimentoObj = new Date()
    nascimentoObj.setDate(Number(nascimento[2]))
    nascimentoObj.setFullYear(Number(nascimento[0]))
    nascimentoObj.setMonth(Number(nascimento[1]) - 1)
    for (const key in nascimento) {
        if (Object.hasOwnProperty.call(nascimento, key)) {
            const element = nascimento[key];
            nascimento[key] = parseInt(element)
        }
    }
    console.log(nascimento)

    
        calcularIdadePrecisa(nascimentoObj).then(function(idade){
            idadeAluno = idade
            console.log(idadeAluno)
            document.getElementById('idadeCalculada').innerText = `Idade: ${idadeAluno.years} ano(s), ${idadeAluno.months} mes(es), ${idadeAluno.days} dia(s)`
            loaderRun()
        }).catch(function(error){
            console.log(error)
        })
        
}

// Drag and Drop
function dragDropCadastroAluno() {
    let dropArea = document.getElementById('drop-area')

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })
  
  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })
  
  function highlight(e) {
    dropArea.classList.add('highlight')
  }
  
  function unhighlight(e) {
    dropArea.classList.remove('highlight')
  }
  function handleDrop(e) {
    console.log(e)
    let dt = e.target
    let files = dt.files

    let matriculaAluno = document.getElementById('matriculaAluno').value
        if (matriculaAluno != '') {
            let metadados = []
            abrirModal('modal', 'Arquivos da matrícula ' + matriculaAluno, `
            <label class="h6">Arquivos que você selecionou</label>
                <div class="block-list block-list-3" id="mostraArquivosSelecionados">
                    
                </div>
            `, '<button type="button" id="enviarArquivosCadastro" class="btn btn-primary">Enviar Arquivos</button> <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>')
            let mostraArquivos = document.getElementById('mostraArquivosSelecionados')
            let c = 0
            for (const i in files) {
                if (Object.hasOwnProperty.call(files, i)) {
                    const file = files[i];
                    console.log(file)
                    let cpf = ''
                    let endereco = ''
                    let outros = ''
                    if (file.name.indexOf('cpf') != -1 || file.name.indexOf('identidade') != -1 || file.name.indexOf('CPF') != -1 || file.name.indexOf('Identidade') != -1 || file.name.indexOf('IDENTIDADE') != -1 || file.name.indexOf('Cpf') != -1) {
                        cpf = 'checked'
                        metadados[i] = 'cpf'
                    } else if (file.name.indexOf('endereço') != -1 || file.name.indexOf('endereco') != -1 || file.name.indexOf('residência') != -1 || file.name.indexOf('residencia') != -1 || file.name.indexOf('Endereco') != -1 || file.name.indexOf('Endereço') != -1 || file.name.indexOf('ENDERECO') != -1 || file.name.indexOf('ENDEREÇO') != -1 || file.name.indexOf('RESIDENCIA') != -1 || file.name.indexOf('RESIDÊNCIA') != -1 || file.name.indexOf('Residência') != -1 || file.name.indexOf('Residencia') != -1) {
                        endereco = 'checked'
                        metadados[i] = 'endereco'
                    } else {
                        outros = 'checked'
                        metadados[i] = 'outros'
                    }
        
                    mostraArquivos.innerHTML += `
                    <div class="block-list__item">
                    ${Number(i) + 1}<br>
                    <label class="h6">${file.name}</label>
                    <br>
                    <b>Tamanho:</b> ${formatBytes(file.size)}
                    <br>
                    <b>Qual arquivo é este?</b>
                    <br><input type="radio" ${cpf} name="tipo${i}" value="${i}|cpf" id="cpfIdentidade${i}"> Identidade e CPF
                    <br><input type="radio" ${endereco} name="tipo${i}" value="${i}|endereco" id="endereco${i}"> Comprovante de endereço
                    <br><input type="radio" ${outros} name="tipo${i}" value="${i}|outros" id="outros${i}"> Outros
                    </div>
                    `
                    c++
                    
                }
            }
            let c2 = 0
            while (c2 < c) {
                document.getElementsByName('tipo' + c2).forEach(element => {
                    element.addEventListener('change', (e) => {
                        if (e.target.checked == true) {
                            metadados[e.target.value.split('|')[0]] = e.target.value.split('|')[1]
                            console.log(metadados)
                        }
                    })
                });
                c2++
            }
            
            document.getElementById('enviarArquivosCadastro').addEventListener('click', (e) => {
                for (const i in files) {
                    if (Object.hasOwnProperty.call(files, i)) {
                        const file = files[i];
                        let metadata = {
                            customMetadata: {
                                tipo: metadados[i]
                            }
                        }
                        let path = 'alunos/' + matriculaAluno + '/arquivos/'
                        uploadFile(file, metadata, path)
                    }
                }
            }) 
        } else {
            AstNotif.dialog('Calma aí!', 'Você tem que definir o número de matricula do aluno para que o sistema saiba onde guardar os arquivos dele. Caso queira obter um novo número de matrícula, clique no botão no início do formulário de cadastro do aluno.')
        }
    }
dropArea.addEventListener('drop', handleDrop, false)
document.getElementById('fileElemCadastroAluno').addEventListener('change', handleDrop)
console.log('sim')
}

function dragDropJaCadastrado() {
    let dropArea = document.getElementById('drop-area-ja-cadastrado')

;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
}

;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })
  
  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })
  
  function highlight(e) {
    dropArea.classList.add('highlight')
  }
  
  function unhighlight(e) {
    dropArea.classList.remove('highlight')
  }
  function handleDrop(e) {
    console.log(e)
    let dt = e.target
    let files = dt.files

    let matriculaAluno = document.getElementById('mostraMatriculaAluno').innerText
        if (matriculaAluno != '') {
            let metadados = []
            abrirModal('modal', 'Arquivos da matrícula ' + matriculaAluno, `
            <label class="h6">Arquivos que você selecionou</label>
                <div class="block-list block-list-3" id="mostraArquivosSelecionados">
                    
                </div>
            `, '<button type="button" id="enviarArquivosCadastro" class="btn btn-primary">Enviar Arquivos</button> <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>')
            let mostraArquivos = document.getElementById('mostraArquivosSelecionados')
            let c = 0
            for (const i in files) {
                if (Object.hasOwnProperty.call(files, i)) {
                    const file = files[i];
                    console.log(file)
                    let cpf = ''
                    let endereco = ''
                    let outros = ''
                    if (file.name.indexOf('cpf') != -1 || file.name.indexOf('identidade') != -1 || file.name.indexOf('CPF') != -1 || file.name.indexOf('Identidade') != -1 || file.name.indexOf('IDENTIDADE') != -1 || file.name.indexOf('Cpf') != -1) {
                        cpf = 'checked'
                        metadados[i] = 'cpf'
                    } else if (file.name.indexOf('endereço') != -1 || file.name.indexOf('endereco') != -1 || file.name.indexOf('residência') != -1 || file.name.indexOf('residencia') != -1 || file.name.indexOf('Endereco') != -1 || file.name.indexOf('Endereço') != -1 || file.name.indexOf('ENDERECO') != -1 || file.name.indexOf('ENDEREÇO') != -1 || file.name.indexOf('RESIDENCIA') != -1 || file.name.indexOf('RESIDÊNCIA') != -1 || file.name.indexOf('Residência') != -1 || file.name.indexOf('Residencia') != -1) {
                        endereco = 'checked'
                        metadados[i] = 'endereco'
                    } else {
                        outros = 'checked'
                        metadados[i] = 'outros'
                    }
        
                    mostraArquivos.innerHTML += `
                    <div class="block-list__item">
                    ${Number(i) + 1}<br>
                    <label class="h6">${file.name}</label>
                    <br>
                    <b>Tamanho:</b> ${formatBytes(file.size)}
                    <br>
                    <b>Qual arquivo é este?</b>
                    <br><input type="radio" ${cpf} name="tipo${i}" value="${i}|cpf" id="cpfIdentidade${i}"> Identidade e CPF
                    <br><input type="radio" ${endereco} name="tipo${i}" value="${i}|endereco" id="endereco${i}"> Comprovante de endereço
                    <br><input type="radio" ${outros} name="tipo${i}" value="${i}|outros" id="outros${i}"> Outros
                    </div>
                    `
                    c++
                    
                }
            }
            let c2 = 0
            while (c2 < c) {
                document.getElementsByName('tipo' + c2).forEach(element => {
                    element.addEventListener('change', (e) => {
                        if (e.target.checked == true) {
                            metadados[e.target.value.split('|')[0]] = e.target.value.split('|')[1]
                            console.log(metadados)
                        }
                    })
                });
                c2++
            }
            
            document.getElementById('enviarArquivosCadastro').addEventListener('click', (e) => {
                for (const i in files) {
                    if (Object.hasOwnProperty.call(files, i)) {
                        const file = files[i];
                        let metadata = {
                            customMetadata: {
                                tipo: metadados[i]
                            }
                        }
                        let path = 'alunos/' + matriculaAluno + '/arquivos/'
                        uploadFile(file, metadata, path)
                    }
                }
            }) 
        } else {
            AstNotif.dialog('Calma aí!', 'Você não acessou um aluno ainda. Acesse o cadastro de um aluno no sistema para que seja possíve fazer o uplodar de arquivos para um aluno cadastrado no sistema.')
        }
    }
dropArea.addEventListener('drop', handleDrop, false)
document.getElementById('fileElemJaCadastrado').addEventListener('change', handleDrop)
console.log('SIM')
}



function uploadFile(file, metadata, path) {
    console.log(file)
    console.log(metadata)
    /* Exemplo de como se usa metadados customizados apenas para referência
    let metadata = {
        customMetadata: {
            'email': usuario.email
        }
    } */
    var uploadTask = firebase.storage().ref('sistemaEscolar/' + path).child(file.name.split('.')[0]).put(file, metadata)
        // Listen for state changes, errors, and completion of the upload.
    uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED, // or 'state_changed'
    function(snapshot) {
    // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
    var progress = ((snapshot.bytesTransferred / snapshot.totalBytes) * 100).toFixed(2);
    console.log('Upload is ' + progress + '% done');
    switch (snapshot.state) {
        case firebase.storage.TaskState.PAUSED: // or 'paused'
        console.log('Upload is paused');
        break;
        case firebase.storage.TaskState.RUNNING: // or 'running'
        console.log('Upload is running');
        break;
    }
    }, function(error) {

    // A full list of error codes is available at
    // https://firebase.google.com/docs/storage/web/handle-errors
    switch (error.code) {
    case 'storage/unauthorized':
        // User doesn't have permission to access the object
        AstNotif.dialog('Erro', 'Você não tem permissões para fazer alterações no caminho que está tentando.')
        break;

    case 'storage/canceled':
        // User canceled the upload
        AstNotif.dialog('Upload Cancelado', 'Upload Cancelado.')
        break;


    case 'storage/unknown':
        // Unknown error occurred, inspect error.serverResponse
        AstNotif.dialog('Erro', error.message)
        break;
    }
    }, function() {
    // Upload completed successfully, now we can get the download URL
    AstNotif.notify("Sucesso", 'Arquivo "' + file.name +  '" enviado aos servidores com sucesso', "<i>agora</i>", {'length': 90000})
    $('#modal').modal('hide')
    });
}

//Funções da aba Alunos
var tipoDeBusca = 'nomeAluno'
function alteraTipoDeBusca(tipo) {
    tipoDeBusca = tipo
}

function desativarAlunos(confirma=false, codTurma, matricula, nome) {
    if (confirma) {
        let nomesObj = {}
        nomesObj[matricula] = nome
        loaderRun(true, 'Desativando alunos...')
        let ativaDesativaAlunos = firebase.functions().httpsCallable('ativaDesativaAlunos')
        ativaDesativaAlunos({codTurma: codTurma, modo: 'desativa', alunos: nomesObj}).then(function(result){
            loaderRun()
            AstNotif.dialog('Sucesso', result.data.answer)
            $('#modal').modal('hide')

        }).catch(function(error){
            AstNotif.dialog('Erro', error.message)
            loaderRun()
        })
    } else {
        abrirModal('modal', 'Confirmação de desativação do aluno', `
                Você confirma a ação de desativação do(s) aluno(s) escolhido(s)?
                <br><br>
                Esta ação ficará salva no histórico de operações do aluno e da turma para futuras consultas.
        `, `<button type="button" data-toggle="tooltip" data-placement="top" title="Desativar agora" class="btn btn-warning" onclick="desativarAlunos(true, '${codTurma}', '${matricula}', '${nome}')">Desativar</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
    }
    
}



function carregaListaDeAlunos(filtro='') {
    console.log(filtro)
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando lista de alunos...'
    let listaAlunos = document.getElementById('listaAlunos')
    if (filtro == '') {
        document.getElementById('listaAlunos').innerHTML = ''
        alunosRef.on('value', (snapshot) => {
            alunos = snapshot.val()
            let c = 0
            for (const matricula in alunos) {
                if (Object.hasOwnProperty.call(alunos, matricula)) {
                    const aluno = alunos[matricula];
                    c++
                    document.getElementById('listaAlunos').innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                            <input type="checkbox" id="checkbox${c}" name="options[]" value="1">
                            <label for="checkbox${c}"></label>
                            </span>
                        </td>
                        <td><a href="#rolaTelaAbaixoAlunos" onclick="abreDadosDoAluno('${matricula}')">${aluno.nomeAluno}</a></td>
                        <td>${matricula}</td>
                        <td>${aluno.turmaAluno}</td>
                        <td>
                            <a href="#" class="edit" onclick="ativarAluno('${matricula}')"><i data-feather="git-pull-request" data-toggle="tooltip" title="Transferir Aluno"></i></a>
                            <a href="#checkbox${c}" class="delete" onclick="desativarAlunos(false, '${aluno.turmaAluno}', '${matricula}', '${aluno.nomeAluno}')"><i data-feather="user-x" data-toggle="tooltip" title="Desativar aluno"></i></a>
                        </td>
                    </tr>`
                }
            }
            feather.replace()
            $('[data-toggle="tooltip"]').tooltip();
            ativaCheckboxes()
            loaderRun()
        })
    } else {
        document.getElementById('listaAlunos').innerHTML = ''
        alunosRef.orderByChild(tipoDeBusca).equalTo(filtro).once('value').then(snapshot => {
            alunos = snapshot.val()
            let c = 0
            for (const matricula in alunos) {
                if (Object.hasOwnProperty.call(alunos, matricula)) {
                    const aluno = alunos[matricula];
                    c++
                    document.getElementById('listaAlunos').innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                            <input type="checkbox" id="checkbox${c}" name="options[]" value="1">
                            <label for="checkbox${c}"></label>
                            </span>
                        </td>
                        <td><a href="#rolaTelaAbaixoAlunos" onclick="abreDadosDoAluno('${matricula}')">${aluno.nomeAluno}</a></td>
                        <td>${matricula}</td>
                        <td>${aluno.turmaAluno}</td>
                        <td>
                            <a href="#" class="action" onclick="ativarAluno('${matricula}')"><i data-feather="user-check" data-toggle="tooltip" title="Reativar Aluno"></i></a>
                            <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"><i data-feather="trash" data-toggle="tooltip" title="Deletar aluno"></i></a>
                        </td>
                    </tr>`
                }
            }
            feather.replace()
            $('[data-toggle="tooltip"]').tooltip();
            ativaCheckboxes()
            loaderRun()
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    }
    
}
function carregaFrequenciaAluno(matricula, turma) {
    let c = 0
    let divFrequencias = document.getElementById('divFrequencias')
    let qtdeAulasFrequencia = document.getElementById('qtdeAulasFrequencia')
    let qtdeAulas
    turmasRef.child(turma + '/status/qtdeAulas').once('value').then(qtdeDeAulas => {
        qtdeAulasFrequencia.innerText = qtdeDeAulas.val()
        qtdeAulas = qtdeDeAulas.val()

        divFrequencias.innerHTML = 'Nenhuma frequência lançada para este aluno, nesta turma'
        turmasRef.child(turma + '/alunos/' + matricula + '/frequencia').on('child_added', frequencia => {
            console.log(frequencia.val())
            if (c==0) {
                divFrequencias.innerHTML = ''
            }
            if (frequencia.val().turma == turma) {
                let diaFrequencia = frequencia.key.split('T')[0]
                let horaFrequencia = frequencia.key.split('T')[1]
                divFrequencias.innerHTML += `
                <div class="row justify-content-start">
                    <div class="col-auto" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">${diaFrequencia.split('-').reverse().join('/')} ás ${horaFrequencia}</div>
                    <div class="col" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">Presente</div>
                </div>
                `
                feather.replace()
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })
            }
            c++
            document.getElementById('totalFrequencias').innerText = c
            console.log(qtdeAulas)
            document.getElementById('porcentagemFrequencia').innerText = ((100*parseInt(c))/parseInt(qtdeAulas)).toFixed(2) + '%'
        })
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
    })


    
}


function chamaDownload(refDown, nome) {
    storageDownload(refDown, nome).then(info => {
        AstNotif.dialog('Sucesso', info.answer + `. Você também pode copiar <a href="${info.url}" target="_blank">este link para download</a>.`)
    }).catch(error => {
        AstNotif.dialog('Error', error)
    })
}

function chamaDelete(ref, nomeArquivo, confirma = false) {
    if (confirma) {
        storageDelete(ref).then(info => {
            AstNotif.notify('Sucesso', info.answer)
            $('#modal').modal('hide')
            carregaArquivosAluno(document.getElementById('mostraMatriculaAluno').innerText)
        }).catch(error => {
            console.log(error)
            AstNotif.dialog('Erro', error.message)
        })
    } else {
        abrirModal('modal', 'Confirmação', `
            Deseja excluir o arquivo "<b>${nomeArquivo}</b>" permanentemente do sistema? (Esta ação não pode ser revertida)
        `, `<button type="button" id="deletaArquivosConfirma" onclick="chamaDelete('${ref}', '${nomeArquivo}', true)" class="btn btn-danger">Deletar arquivo</button> <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
    }
}

function carregaArquivosAluno(matricula) {
    let listaArquivosAluno = document.getElementById('listaArquivosAluno')
    listaArquivosAluno.innerHTML = ''
    let storageRef = alunosStorageRef.child(matricula + '/arquivos')

    

        // Find all the prefixes and items.
    storageRef.listAll().then(function(res) {
        res.prefixes.forEach(function(folderRef) {
        // All the prefixes under listRef.
        // You may call listAll() recursively on them.
        });
        res.items.forEach(function(itemRef) {
            // All the items under listRef.
            itemRef.getMetadata().then(function(metadata) {
                console.log(metadata)
                let imagem
                if (metadata.customMetadata.tipo == 'cpf') imagem = 'cpf-icon.png'
                else if(metadata.customMetadata.tipo == 'endereco') imagem = 'home.png'
                listaArquivosAluno.innerHTML += `
                    <div class="col-lg-3 col-xl-2">
                        <div class="file-man-box">
                        <a class="file-close" onclick="chamaDelete('${metadata.fullPath}', '${metadata.name}')"><i data-feather="x"></i></a>
                        <div class="file-img-box">
                            <img src="../images/${imagem}" alt="icon">
                        </div>
                        <a onclick="chamaDownload('${metadata.fullPath}', '${metadata.name}')" class="file-download" name="downBtns"><i data-feather="download"></i></a>
                        <div class="file-man-title">
                            <h6 class="mb-0 text-overflow" data-toggle="tooltip" data-placement="top" title="${metadata.name}">${metadata.name}</h5>
                            <p class="mb-0"><small>${formatBytes(metadata.size)}</small></p>
                        </div>
                        </div>
                    </div>
                `
                feather.replace()
                $(function () {
                    $('[data-toggle="tooltip"]').tooltip()
                })

            }).catch(function(error) {
                console.log(error)
                AstNotif.dialog('Erro', error.message)
            })
            
            console.log(itemRef)
            
        });
    }).catch(function(error) {
        // Uh-oh, an error occurred!
        console.log(error)
        AstNotif.dialog('Erro', error.message)
    });
}

var dadosResponsaveis = {}
function abreDadosDoAluno(matricula, desativado=false, notasDesativado=false) {
    carregaHistoricoAluno(matricula)
    carregaArquivosAluno(matricula)
    
    document.getElementById('infoDoAluno').style.display = 'block'
    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block'
    document.getElementById('secGeraFicha').innerHTML = `<button class="btn btn-outline-primary" id="btnGeraFicha" onclick="gerarFichaAluno('${matricula}')">Gerar ficha de matrícula em PDF</button>`
    let dados
    if (desativado != false) {
        dados = desativado
        document.getElementById('alunoDesativado').style.display = 'block'
    } else {
        dados = alunos[matricula]
        document.getElementById('alunoDesativado').style.display = 'none'
    }
    carregaFrequenciaAluno(matricula, dados.turmaAluno)
    dadosResponsaveis = {
        nomeResponsavelAluno1: dados.nomeResponsavelAluno1,
        relacaoAluno1: dados.relacaoAluno1,
        numeroComercialResponsavel1: dados.numeroComercialResponsavel1,
        numeroCelularResponsavel1: dados.numeroCelularResponsavel1,
        rgResponsavel1: dados.rgResponsavel1,
        cpfResponsavel1: dados.cpfResponsavel1,
        // Dados de Filiação responsável 2
        nomeResponsavelAluno2: dados.nomeResponsavelAluno2,
        relacaoAluno2: dados.relacaoAluno2,
        numeroComercialResponsavel2: dados.numeroComercialResponsavel2,
        numeroCelularResponsavel2: dados.numeroCelularResponsavel2,
        rgResponsavel2: dados.rgResponsavel2,
        cpfResponsavel2: dados.cpfResponsavel2,
        // Dados de Filiação Responsável financeiro
        nomeResponsavelFinanceiroAluno: dados.nomeResponsavelFinanceiroAluno,
        relacaoFinanceiroAluno: dados.relacaoFinanceiroAluno,
        numeroComercialFinanceiroAluno: dados.numeroComercialFinanceiroAluno,
        numeroCelularFinanceiroAluno: dados.numeroCelularFinanceiroAluno,
        rgFinanceiroAluno: dados.rgFinanceiroAluno,
        cpfFinanceiroAluno: dados.cpfFinanceiroAluno,
        // Dados de Filiação responsável pedagógico/didático
        nomeResponsavelPedagogicoAluno: dados.nomeResponsavelPedagogicoAluno,
        relacaoPedagogicoAluno: dados.relacaoPedagogicoAluno,
        numeroComercialPedagogicoAluno: dados.numeroComercialPedagogicoAluno,
        numeroCelularPedagogicoAluno: dados.numeroCelularPedagogicoAluno,
        rgPedagogicoAluno: dados.rgPedagogicoAluno,
        cpfPedgogicoAluno: dados.cpfPedgogicoAluno
    }

    
    
    document.getElementById('mostraNomeAluno').innerText = dados.nomeAluno
    document.getElementById('mostraCpfAluno').innerText = dados.cpfAluno
    document.getElementById('mostraRgAluno').innerText = dados.rgAluno
    document.getElementById('mostraCelularAluno').innerText = dados.celularAluno
    document.getElementById('mostraTelefoneAluno').innerText = dados.telefoneAluno
    document.getElementById('timestampDoAluno').innerText = 'Aluno cadastrado em: ' + new Date(dados.timestamp._seconds * 1000)
    document.getElementById('mostraDataNascimentoAluno').innerText = dados.dataNascimentoAluno

    let nascimento = dados.dataNascimentoAluno.split('-')
    let nascimentoObj = new Date()
    nascimentoObj.setDate(Number(nascimento[2]))
    nascimentoObj.setFullYear(Number(nascimento[0]))
    nascimentoObj.setMonth(Number(nascimento[1]) - 1)
    calcularIdadePrecisa(nascimentoObj).then(function(idade){
        document.getElementById('mostraIdadeAluno').innerText = `${idade.years} anos, ${idade.months} mês(es), e ${idade.days} dias`
    }).catch(function(error){
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
    document.getElementById('mostraHoraEDiasAluno').innerText = dados.horaEDiasAluno
    document.getElementById('mostraTurmaAluno').innerHTML = dados.turmaAluno
    document.getElementById('mostraEmailAluno').innerText = dados.emailAluno
    document.getElementById('mostraMatriculaAluno').innerText = dados.matriculaAluno
    document.getElementById('mostraEnderecoAluno').innerText = `${dados.enderecoAluno}, ${dados.numeroAluno}, ${dados.bairroAluno}, ${dados.cidadeAluno}, ${dados.estadoAluno}. CEP ${dados.cepAluno}.`
    document.getElementById('rolaTelaAbaixoAlunos').focus()
    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'
    turmasRef.child(`${dados.turmaAluno}/alunos/${matricula}/notas`).once('value').then(snapshot => {
        turmasRef.child(`${dados.turmaAluno}/notas`).once('value').then(notasReferencia => {
            let notas = snapshot.val()
            let referenciaDeNotas = notasReferencia.val()
            if (desativado != false) {
                notas = notasDesativado
            }
            console.log(notas)
            let notasDoAlunoDiv = document.getElementById('notasDoAluno')
            notasDoAlunoDiv.innerHTML = ''
            //let somatorioNotasDiv = document.getElementById('somatorioNotas')
            if (notas == null) {
                notasDoAlunoDiv.innerHTML = 'Nenhuma nota foi lançada para este aluno'
            }
            let somatorioNotas = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valorNota = notas[nomeNota];
                    const barra = (100*valorNota)/referenciaDeNotas[nomeNota]
                    somatorioNotas += valorNota
                    notasDoAlunoDiv.innerHTML += `
                    
                    <small id="nomeNota${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small><small id="notaReferencia">/${referenciaDeNotas[nomeNota]}</small>
                    <div class="progress mb-3" style="height: 10px">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${barra}%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="${referenciaDeNotas[nomeNota]}">${valorNota}</div>
                    </div>
                    `
                    
                }
            }
            notasDoAlunoDiv.innerHTML += `<div id="somatorioNotas">Somatório: <b>${somatorioNotas}</b>/100</div>`

            /*document.getElementById('pontosAudicao').innerText = notas.audicao
            document.getElementById('pontosFala').innerText = notas.fala
            document.getElementById('pontosEscrita').innerText = notas.escrita
            document.getElementById('pontosLeitura').innerText = notas.leitura
            document.getElementById('barraPontosAudicao').style.width = notas.audicao * 20 + '%'
            document.getElementById('barraPontosFala').style.width = notas.fala * 20 + '%'
            document.getElementById('barraPontosEscrita').style.width = notas.escrita * 20 + '%'
            document.getElementById('barraPontosLeitura').style.width = notas.leitura * 20 + '%'*/
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })

    turmasRef.child(`${dados.turmaAluno}/alunos/${matricula}/desempenho`).on('value', (desempenho) => {
        desempenhoRef.once('value').then(referenciaDesempenho => {
            let notas = desempenho.val()
            let referenciaDeNotas = referenciaDesempenho.val()
            console.log(notas)
            let notasDoAlunoDiv = document.getElementById('desempenhoAluno')
            notasDoAlunoDiv.innerHTML = ''
            //let somatorioNotasDiv = document.getElementById('somatorioNotas')
            if (notas == null) {
                notasDoAlunoDiv.innerHTML = 'Nenhuma nota de desempenho foi lançada para este aluno'
            }
            let somatorioNotas = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valorNota = notas[nomeNota];
                    const barra = (100*valorNota)/referenciaDeNotas[nomeNota]
                    somatorioNotas += valorNota
                    notasDoAlunoDiv.innerHTML += `
                    
                    <small id="nomeDesempenho${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small><small id="notaReferencia">/${referenciaDeNotas[nomeNota]}</small>
                    <div class="progress mb-3" style="height: 10px">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${barra}%" aria-valuenow="${valorNota}" aria-valuemin="0" aria-valuemax="${referenciaDeNotas[nomeNota]}">${valorNota}</div>
                    </div>
                    `
                    
                }
            }
            
            notasDoAlunoDiv.innerHTML += `<div id="somatorioNotas">Somatório: <b>${somatorioNotas}</b></div>`

            
        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            console.log(error)
        })
        
    })
}

function alteraNotasDesempenho(confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Lançando notas dos alunos no sistema...'
        var notasParaLancar = {}
        let c2 = 0
        while (c2 <= contadorNotas) {
            try {
                let index = document.getElementById('nomeNota' + c2).value
                let valor = Number(document.getElementById('valorNota' + c2).value)
                notasParaLancar[index] = valor 
            } catch (error) {
                console.log(error)
            }
            
            c2++
        }

        desempenhoRef.set(notasParaLancar).then(() => {
            $('#modal').modal('hide')
            loaderRun()
            AstNotif.notify('Sucesso', 'Desempenho do aluno alterado com sucesso.')

        }).catch(error => {
            AstNotif.dialog('Erro', error.message)
            loaderRun()
            console.log(error)
        })
    } else {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Buscando notas...'
        
        desempenhoRef.once('value').then(referenciaDesempenho => {
            let notas = referenciaDesempenho.val()

            abrirModal('modal', 'Distribuir notas de referência de desempenho', `
            Ao distribuir essas notas, todos os professores terão de lançar pontos para todos os alunos com cada um dos tópicos que estiverem definidos nesta referência.<br><br>
            <button type="button" data-toggle="tooltip" data-placement="top" title="Adicionar nota" class="btn btn-light btn-sm" onclick="addCampoNota()"><span data-feather="plus-square"></span></button><br>
            <div class="row"><div class="col-2"><label>Nota</label></div><div class="col-2"><label>Valor</label></div></div>
            <section id="camposLancaNotas"></section> 
            `, `<button type="button" data-toggle="tooltip" data-placement="top" title="Distribuir essas notas de referência para que os professores possam fazer lançamentos." class="btn btn-primary" onclick="alteraNotasDesempenho(true)">Distribuir notas</button><button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`)
            feather.replace()
            contadorNotas = 0
            contadorNotasExtras = 0
            notasDistribuidas = {}
            somatorioDistribuidas = 0
            
            let c = 0
            for (const nomeNota in notas) {
                if (Object.hasOwnProperty.call(notas, nomeNota)) {
                    const valor = notas[nomeNota];
                    document.getElementById('camposLancaNotas').innerHTML += `
                    <div class="row" id="linha${c}">
                        <div class="col-2" >
                            <input type="text" class="form-control" id="nomeNota${c}" placeholder="EX ${c + 1}" value="${nomeNota}">
                        </div>
                        <div class="col-2">
                            <input type="number" id="valorNota${c}" class="form-control" value="${valor}" onkeyup="somaNotasDistribuidas('${c}')" placeholder="15.5">
                        </div>
                        <button type="button" class="btn btn-light btn-sm" onclick="document.getElementById('linha${c}').remove(), contadorNotas--"><span data-feather="x-square"></span></button><br>
                    </div>
                    `
                    c++
                }
            }
            contadorNotas = c
            feather.replace()
           

            loaderRun()
        })

    }
}

var contadorNotas = 0
var contadorNotasExtras = 0
function addCampoNota(extra=false) {
    let camposNotas = document.getElementById('camposLancaNotas')
    
    if (extra) {
        
    } else {
        camposNotas.innerHTML += 
        `
        <div class="row" id="linha${contadorNotas}">
            <div class="col-2" >
                <input type="text" class="form-control" id="nomeNota${contadorNotas}" placeholder="EX ${contadorNotas + 1}" value="EX ${contadorNotas + 1}">
            </div>
            <div class="col-2">
                <input type="number" id="valorNota${contadorNotas}" value=0 class="form-control"  placeholder="15.5">
            </div>
            <button type="button" class="btn btn-light btn-sm" onclick="somaNotasDistribuidas('${contadorNotas}', true), document.getElementById('linha${contadorNotas}').remove(), contadorNotas--"><span data-feather="x-square"></span></button><br>
        </div>
        `
        feather.replace()
        contadorNotas++
    }
}

function historicoAluno(matricula, turma) {
    
    abrirModal('modal', 'Histórico escolar', 
            `
            <div class="container-xl">
            <div class="table-responsive">
              <div class="table-wrapper">
                <div class="table-title">
                  <div class="row">
                    <div class="col-sm-6">
                      <h2>Histórico <b>Escolar</b></h2>
                    </div>
                    <div class="col-sm-6">
                      <!--<a href="#" class="btn btn-success" onclick="carregaListaDeAlunos()">&nbsp; <span class="feather-24" data-feather="refresh-cw"></span><span>Atualizar lista</span></a>
                      <a href="#deleteEmployeeModal" class="btn btn-danger" data-toggle="modal">&nbsp;<span class="feather-24" data-feather="trash"></span> <span>Delete</span></a>-->						
                    </div>
                  </div>
                </div>
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>
                        <span class="custom-checkbox">
                          <input type="checkbox" id="selectAll">
                          <label for="selectAll"></label>
                        </span>
                      </th>
                      <th><a href="#" id="ordenaTurma">Turma</a></th>
                      <th><a href="#" id="ordenaData">Data de fechamento</a></th>
                      <th><a href="#" id="ordenaNota">Somatório das notas</a></th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody id="listaHistorico">
                    
                  </tbody>
                </table>
                
              </div>
            </div>
          </div>    

            `, `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
        )
        let listaHistorico = document.getElementById('listaHistorico')
        let c = 0
    alunosRef.child(matricula + '/historicoEscolar').on('child_added', (registro) => {
        
        c++
        let dataFechamento = new Date(registro.val().timestamp._seconds * 1000)
        let notas = registro.val().infoAluno.notas
        let somatorioNota = 0
        for (const nomeNota in notas) {
            if (Object.hasOwnProperty.call(notas, nomeNota)) {
                const nota = notas[nomeNota];
                somatorioNota += nota
            }
        }
        listaHistorico.innerHTML += `
        <tr>
            <td>
                <span class="custom-checkbox">
                    <input type="checkbox" id="checkbox${c}" name="options[]" value="1">
                    <label for="checkbox${c}"></label>
                </span>
            </td>
            <td>${registro.val().turma}</td>
            <td>${dataFechamento.getDate()}/${dataFechamento.getMonth() + 1}/${dataFechamento.getFullYear()}</td>
            <td><b>${somatorioNota}</b>/100</td>
            <td>
                <a id="emiteBoletim${c}" onclick="emiteBoletim('${matricula}', '${registro.key}')" class="action" data-toggle="modal"><i data-feather="file-text" data-toggle="tooltip" title="Emitir boletim"></i></a>
                <a href="#" id="verHistorico${c}" class="edit" data-toggle="modal"><i data-feather="eye" data-toggle="tooltip" title="Visualizar dados"></i></a>
            </td>
        </tr>
        `
        document.querySelector('#verHistorico' + c).addEventListener('click', (e) => {
            e.preventDefault()
            visualizarDadosDoHistorico(registro.val())
        })

        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
        feather.replace()
        loaderRun()
        ativaCheckboxes()
    })
}

function emiteBoletim(matricula, chave) {
    document.getElementById('corpoBoletim').innerHTML = `<iframe src="../resources/pdfsProntos/modeloBoletim.html#${matricula}?${chave}" frameborder="0" width="100%" height="300px" id="boletimPdf" name="boletimPdf"></iframe>`
    $('#boletimModal').modal({backdrop: 'static'})
}

function visualizarDadosDoHistorico(info) {
    console.log(info)
    $('#modal').modal('hide')
    let referenciaDeNotas = info.infoAluno.notasReferencia
    document.getElementById('mostraTurmaAluno').innerText = info.turma
    document.getElementById('notasDoAluno').innerHTML = ''
    let somatorioNotas = 0
    for (const nomeNota in info.infoAluno.notas) {
        if (Object.hasOwnProperty.call(info.infoAluno.notas, nomeNota)) {
            const nota = info.infoAluno.notas[nomeNota];
            const barra = (100*nota)/referenciaDeNotas[nomeNota]
            somatorioNotas += nota
            
            document.getElementById('notasDoAluno').innerHTML += `
                <small id="nomeNota${nomeNota}"><b>${nomeNota}</b>: ${nota}</small><small id="notaReferencia">/${referenciaDeNotas[nomeNota]}</small>
                <div class="progress mb-3" style="height: 10px">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${barra}%" aria-valuenow="${nota}" aria-valuemin="0" aria-valuemax="${referenciaDeNotas[nomeNota]}">${nota}</div>
                </div>
            `
        }
    }
    document.getElementById('notasDoAluno').innerHTML += `<div id="somatorioNotas">Somatório: <b>${somatorioNotas}</b></div>`

    somatorioNotas = 0
    document.getElementById('desempenhoAluno').innerHTML = ''
    for (const nomeNota in info.infoAluno.desempenho) {
        if (Object.hasOwnProperty.call(info.infoAluno.desempenho, nomeNota)) {
            const valorNota = info.infoAluno.desempenho[nomeNota];
            
            somatorioNotas += valorNota
            document.getElementById('desempenhoAluno').innerHTML += `
            
            <small id="nomeDesempenho${nomeNota}"><b>${nomeNota}</b>: ${valorNota}</small>
            <br><br>
            `
            
        }
    }
    
    document.getElementById('desempenhoAluno').innerHTML += `<div id="somatorioNotas">Somatório: <b>${somatorioNotas}</b></div>`

    document.getElementById('divFrequencias').innerHTML = ''
    for (const data in info.infoAluno.frequencia) {
        if (Object.hasOwnProperty.call(info.infoAluno.frequencia, data)) {
            let diaFrequencia = data.split('T')[0]
            let horaFrequencia = data.split('T')[1]

            document.getElementById('divFrequencias').innerHTML += `
            <div class="row justify-content-start">
                <div class="col-auto" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">${diaFrequencia.split('-').reverse().join('/')} ás ${horaFrequencia}</div>
                <div class="col-auto" style="background-color: rgba(86,61,124,.15);border: 1px solid rgba(86,61,124,.2);">Presente</div>
            </div>
            `
            
        }
    }

    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block'
    document.getElementById('rolaTelaAbaixoAlunos').focus()
    document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'

    AstNotif.notify('Notas carregadas...', 'Agora você está visualizando as notas do período que você escolheu.', 'agora', {length: 15000})
}

function followUpAluno(matricula) {
    
    if (matricula == '00000' || matricula == '') {
        AstNotif.dialog('Atenção', 'Você deve clicar em um aluno para descrever um follow up.')
        loaderRun()
    } else {
        followUpRef.on('value', (snapshot) => {
            const aluno = alunos[matricula]
            let id
            let followUpSalvos
            if (snapshot.exists() == false) {
                id = 0
            } else {
                followUpSalvos = snapshot.val()
                for (const idFollow in followUpSalvos) {
                    if (Object.hasOwnProperty.call(followUpSalvos, idFollow)) {
                        const followUp = followUpSalvos[idFollow];
                        id = Number(idFollow) + 1
                    }
                }
            }
            abrirModal('modal', 'Adicionar um Follow Up', `
                <form id="adicionarFollowUpAluno" >
                    <label>Nome: ${aluno.nomeAluno}</label> | <label>Matrícula: ${aluno.matriculaAluno}</label>

                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="basic-addon3">ID do FollowUp</span>
                        </div>
                        <input type="text" class="form-control" id="idFollowUpAluno" name="idFollowUpAluno" aria-describedby="basic-addon3" readonly value="${id}">
                    </div>
                    <div class="input-group mb-3">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="tituloFollowUpAluno" >Título</span>
                        </div>
                        <input type="text" class="form-control" name="tituloFollowUpAluno" id="basic-url" aria-describedby="basic-addon3">
                    </div>
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <span class="input-group-text">Descrição</span>
                        </div>
                        <textarea class="form-control" aria-label="With textarea" name="descricaoFollowUp"></textarea>
                    </div>
                    <br>
                    <button class="btn btn-primary" type="submit" id="salvarFollowUpAluno">Salvar Follow Up</button>
                    <input type="text" name="matriculaFollowUp" id="matriculaFollowUp" value="${aluno.matriculaAluno}" style="display: none">
                    <input type="text" name="nomeFollowUp" id="nomeFollowUp" value="${aluno.nomeAluno}" style="display: none">
                </form>`,
                `<button class="btn btn-secondary" data-dismiss="modal">Cancelar</button><button class="btn btn-primary" data-dismiss="modal" onclick="carregaFollowUps('${aluno.matriculaAluno}')">Ver todos os Follow Up do aluno</button>`
            )
            document.querySelector('#adicionarFollowUpAluno').addEventListener('submit', (e) => {
                e.preventDefault()
                loader.style.display = 'block'
                loaderMsg.innerText = 'Carregando dados do FollowUp...'
                const dados = new FormData(e.target);
                let dadosFollowUp = {}
                dadosFollowUp.nome = dados.get('nomeFollowUp')
                dadosFollowUp.matricula = dados.get('matriculaFollowUp')
                dadosFollowUp.descricao = dados.get('descricaoFollowUp')
                dadosFollowUp.titulo = dados.get('tituloFollowUpAluno')
                dadosFollowUp.id = dados.get('idFollowUpAluno')
                dadosFollowUp.autor = usuarioAtual().displayName
                console.log(dadosFollowUp)
                followUpRef.child(dadosFollowUp.id).set(dadosFollowUp).then(() => {
                    AstNotif.notify('Sucesso', 'O FollowUp foi salvo com sucesso.', 'agora', {length: -1})
                    loaderRun()
                }).catch(error =>{
                    AstNotif.dialog('Erro', error.message)
                    console.log(error)
                    loaderRun()
                })
            })
        })
        
    }
}

function carregaFollowUps(matricula='') {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando Follow Up...'
    followUpRef.orderByChild('matricula').equalTo(matricula).once('value').then(snapshot => {
        abrirModal('modal', `FollowUp(s) cadastrado(s)`,
            `
            <label id="nomeAlunoDoFollowUp"></label>
            <div class="overflow-auto" style="height: fit-content; max-height: 280px;">
                <div class="list-group" id="listaFollowUpAluno">

                </div>
            </div>
            `
            , `<button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        let listaFollowUpAluno = document.getElementById('listaFollowUpAluno')
        listaFollowUpAluno.innerHTML = ''
        for (const id in snapshot.val()) {
            if (Object.hasOwnProperty.call(snapshot.val(), id)) {
                const followUp = snapshot.val()[id];
                document.getElementById('nomeAlunoDoFollowUp').innerText = followUp.nome + ' | ' + followUp.matricula
                listaFollowUpAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verFollowUp('${id}')"><b>Título:</b> ${followUp.titulo}</button>`
            }
        }
        loaderRun()
    }).catch((error) => {
        console.log(error)
        AstNotif.dialog('Erro', error.message)
        loaderRun()
    })
}

function verFollowUp(id) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando FollowUp...'
    followUpRef.child(id).once('value').then(snapshot => {
        AstNotif.dialog(snapshot.val().titulo, snapshot.val().descricao + ' <br><br> <b>Autor do FollowUp:</b> ' + snapshot.val().autor, {positive: "OK",negative: ''})

        loaderRun()
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
    
}
function mostraDadosResponsaveis() {
    abrirModal('modal', 'Dados dos reponsáveis', 
        `
        <label class="h6">Dados de filiação</label>
        <div class="form-row border border-secondary rounded">
          <div class="form-group col-md-4">
            <label for="inputAddress">Filiação ou Responsável legal 1</label>
            <input type="text" class="form-control" id="nomeResponsavelAluno1AbaAlunos" name="nomeResponsavelAluno1" placeholder="Nome"  onblur="maiusculo(this)">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Relação</label>
            <br>
            <select class="form-control form-control-md" name="relacaoAluno1" id="relacaoAluno1AbaAlunos">
              <option hidden selected>Escolha...</option>
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Tio/Tia">Tio/Tia</option>
              <option value="Avô/Avó">Avô/Avó</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número comercial</label>
            <input type="text" class="form-control" id="numeroComercialResponsavel1AbaAlunos" name="numeroComercialResponsavel1"  placeholder="Comercial">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número Celular</label>
            <input type="text" class="form-control" id="numeroCelularResponsavel1AbaAlunos" name="numeroCelularResponsavel1" placeholder="Celular">
          </div>
          <div class="form-group col-auto">
            <label for="inputEmail4">RG</label>
            <input type="text" class="form-control" id="rgResponsavel1AbaAlunos" name="rgResponsavel1" placeholder="RG">
          </div>
          <div class="form-group col-auto">
            <label for="inputPassword4">CPF</label>
            <input type="text" class="form-control" id="cpfResponsavel1AbaAlunos" name="cpfResponsavel1" placeholder="CPF" onchange="verificaCPF(this.value)">
            <small id="cpfHelp" class="form-text text-muted">Digite um CPF válido, existe um algoritmo de validação neste campo.</small>
          </div>
        </div>
        <br>
        
        <div class="form-row border border-secondary rounded">
          <div class="form-group col-md-4">
            <label for="inputAddress">Filiação ou Responsável legal 2</label>
            <input type="text" class="form-control" id="nomeResponsavelAluno2AbaAlunos" name="nomeResponsavelAluno2" placeholder="Nome" onblur="maiusculo(this)">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Relação</label>
            <br>
            <select class="form-control form-control-md" name="relacaoAluno2" id="relacaoAluno2AbaAlunos">
              <option hidden selected>Escolha...</option>
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Tio/Tia">Tio/Tia</option>
              <option value="Avô/Avó">Avô/Avó</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número comercial</label>
            <input type="text" class="form-control" id="numeroComercialResponsavel2AbaAlunos" name="numeroComercialResponsavel2" placeholder="Comercial">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número Celular</label>
            <input type="text" class="form-control" id="numeroCelularResponsavel2AbaAlunos" name="numeroCelularResponsavel2" placeholder="Celular">
          </div>
          <div class="form-group col-auto">
            <label for="inputEmail4">RG</label>
            <input type="text" class="form-control" id="rgResponsavel2AbaAlunos" name="rgResponsavel2" placeholder="RG">
          </div>
          <div class="form-group col-auto">
            <label for="inputPassword4">CPF</label>
            <input type="text" class="form-control" id="cpfResponsavel2AbaAlunos" name="cpfResponsavel2" placeholder="CPF" onchange="verificaCPF(this.value)">
            <small id="cpfHelp" class="form-text text-muted">Digite um CPF válido, existe um algoritmo de validação neste campo.</small>
          </div>
          &nbsp;&nbsp;&nbsp;
        </div>
        <br>
        <hr>
        <label class="h6">Dados do responsável Financeiro</label>
        <div class="form-row border border-primary rounded">
          <div class="form-group col-md-4">
            <label for="inputAddress">Responsável financeiro</label>
            <input type="text" class="form-control" id="nomeResponsavelFinanceiroAlunoAbaAlunos" name="nomeResponsavelFinanceiroAluno" placeholder="Nome" onblur="maiusculo(this)">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Relação</label>
            <br>
            <select class="form-control form-control-md" name="relacaoFinanceiroAluno" id="relacaoFinanceiroAlunoAbaAlunos">
              <option hidden selected>Escolha...</option>
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Tio/Tia">Tio/Tia</option>
              <option value="Avô/Avó">Avô/Avó</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número comercial</label>
            <input type="text" class="form-control" id="numeroComercialFinanceiroAlunoAbaAlunos" name="numeroComercialFinanceiroAluno" placeholder="Comercial">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número Celular</label>
            <input type="text" class="form-control" id="numeroCelularFinanceiroAlunoAbaAlunos" name="numeroCelularFinanceiroAluno" placeholder="Celular">
          </div>
          <div class="form-group col-md-5">
            <label for="inputPassword4">Email</label>
            <input type="email" class="form-control" id="emailResponsavelFinanceiroAbaAlunos" name="emailresponsavelFinanceiro" placeholder="Email">
          </div>
          <div class="form-group col-auto">
            <label for="inputEmail4">RG</label>
            <input type="text" class="form-control" id="rgFinanceiroAlunoAbaAlunos" name="rgFinanceiroAluno" placeholder="RG">
          </div>
          <div class="form-group col-auto">
            <label for="inputPassword4">CPF</label>
            <input type="text" class="form-control" id="cpfFinanceiroAlunoAbaAlunos" name="cpfFinanceiroAluno"  placeholder="CPF" onchange="verificaCPF(this.value)">
            <small id="cpfHelp4" class="form-text text-muted">Digite um CPF válido, existe um algoritmo de validação neste campo.</small>
          </div>
        </div>
        <br>
        <label class="h6">Dados do responsável Financeiro</label>
        <div class="form-row border border-success rounded">
          
          <div class="form-group col-md-4">
            <label for="inputAddress">Responsável pedagógico/didático</label>
            <input type="text" class="form-control" id="nomeResponsavelPedagogicoAlunoAbaAlunos" placeholder="Nome" onblur="maiusculo(this)">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Relação</label>
            <br>
            <select class="form-control form-control-md" name="relacaoPedagogicoAluno" id="relacaoPedagogicoAlunoAbaAlunos">
              <option hidden selected>Escolha...</option>
              <option value="Mãe">Mãe</option>
              <option value="Pai">Pai</option>
              <option value="Tio/Tia">Tio/Tia</option>
              <option value="Avô/Avó">Avô/Avó</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número comercial</label>
            <input type="text" class="form-control" id="numeroComercialPedagogicoAlunoAbaAlunos" name="numeroComercialPedagogicoAluno" placeholder="Comercial">
          </div>
          <div class="form-group col-md-2">
            <label for="inputAddress">Número Celular</label>
            <input type="text" class="form-control" id="numeroCelularPedagogicoAlunoAbaAlunos" name="numeroCelularPedagogicoAluno" placeholder="Celular">
          </div>
          <div class="form-group col-md-5">
            <label for="inputPassword4">Email</label>
            <input type="email" class="form-control" id="emailResponsavelPedagogicoAbaAlunos" name="emailResponsavelPedagogico" placeholder="Email">
          </div>
          <div class="form-group col-auto">
            <label for="inputEmail4">RG</label>
            <input type="text" class="form-control" id="rgPedagogicoAlunoAbaAlunos" name="rgPedagogicoAluno" placeholder="RG">
          </div>
          <div class="form-group col-auto">
            <label for="inputPassword4">CPF</label>
            <input type="text" class="form-control" id="cpfPedagogicoAlunoAbaAlunos" name="cpfPedgogicoAluno" placeholder="CPF" onchange="verificaCPF(this.value)">
            <small id="cpfHelp3" class="form-text text-muted">Digite um CPF válido, existe um algoritmo de validação neste campo.</small>
          </div>
        </div>
        `, 
        `<button class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
    )

    // Dados de Filiação Responsavel 1
    document.getElementById('nomeResponsavelAluno1AbaAlunos').value = dadosResponsaveis.nomeResponsavelAluno1
    document.getElementById('relacaoAluno1AbaAlunos').value = dadosResponsaveis.relacaoAluno1
    document.getElementById('numeroComercialResponsavel1AbaAlunos').value = dadosResponsaveis.numeroComercialResponsavel1
    document.getElementById('numeroCelularResponsavel1AbaAlunos').value = dadosResponsaveis.numeroCelularResponsavel1
    document.getElementById('rgResponsavel1AbaAlunos').value = dadosResponsaveis.rgResponsavel1
    document.getElementById('cpfResponsavel1AbaAlunos').value = dadosResponsaveis.cpfResponsavel1
    // Dados de Filiação responsável 2
    document.getElementById('nomeResponsavelAluno2AbaAlunos').value = dadosResponsaveis.nomeResponsavelAluno2
    document.getElementById('relacaoAluno2AbaAlunos').value = dadosResponsaveis.relacaoAluno2
    document.getElementById('numeroComercialResponsavel2AbaAlunos').value = dadosResponsaveis.numeroComercialResponsavel2
    document.getElementById('numeroCelularResponsavel2AbaAlunos').value = dadosResponsaveis.numeroCelularResponsavel2
    document.getElementById('rgResponsavel2AbaAlunos').value = dadosResponsaveis.rgResponsavel2
    document.getElementById('cpfResponsavel2AbaAlunos').value = dadosResponsaveis.cpfResponsavel2
    // Dados de Filiação Responsável financeiro
    document.getElementById('nomeResponsavelFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.nomeResponsavelFinanceiroAluno
    document.getElementById('relacaoFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.relacaoFinanceiroAluno
    document.getElementById('numeroComercialFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.numeroComercialFinanceiroAluno
    document.getElementById('numeroCelularFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.numeroCelularFinanceiroAluno
    document.getElementById('rgFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.rgFinanceiroAluno
    document.getElementById('cpfFinanceiroAlunoAbaAlunos').value = dadosResponsaveis.cpfFinanceiroAluno
    // Dados de Filiação responsável pedagógico/didático
    document.getElementById('nomeResponsavelPedagogicoAlunoAbaAlunos').value = dadosResponsaveis.nomeResponsavelPedagogicoAluno
    document.getElementById('relacaoPedagogicoAlunoAbaAlunos').value = dadosResponsaveis.relacaoPedagogicoAluno
    document.getElementById('numeroComercialPedagogicoAlunoAbaAlunos').value = dadosResponsaveis.numeroComercialPedagogicoAluno
    document.getElementById('numeroCelularPedagogicoAlunoAbaAlunos').value = dadosResponsaveis.numeroCelularPedagogicoAluno
    document.getElementById('rgPedagogicoAlunoAbaAlunos').value = dadosResponsaveis.rgPedagogicoAluno
    document.getElementById('cpfPedgogicoAlunoAbaAlunos').value = dadosResponsaveis.cpfPedgogicoAluno
}

function carregaHistoricoAluno(matricula) {
    let listaHistoricoAluno = document.getElementById('listaHistoricoAluno')
    listaHistoricoAluno.innerHTML = ''
    try {
        const historico = alunos[matricula].historico
        for (const key in historico) {
            if (Object.hasOwnProperty.call(historico, key)) {
                const infos = historico[key];
                if (infos.operacao == 'Transferência de alunos') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> ${infos.dados.turmaParaQualFoiTransferido}</button>`
                } else if(infos.operacao == 'Desativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> Desativado</button>`
                } else if (infos.operacao == 'Reativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: Aluno reativado na turma ${infos.dados.turmaAtivacao}</button>`
                }
            }
        }
    } catch (error) {
        const historico = alunosDesativados[matricula].dadosAluno.historico
        for (const key in historico) {
            if (Object.hasOwnProperty.call(historico, key)) {
                const infos = historico[key];
                if (infos.operacao == 'Transferência de alunos') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turmaAtual} --> ${infos.dados.turmaParaQualFoiTransferido}</button>`
                } else if(infos.operacao == 'Desativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: ${infos.dados.turma} --> Desativado</button>`
                } else if (infos.operacao == 'Reativação de aluno') {
                    listaHistoricoAluno.innerHTML += `<button class="list-group-item list-group-item-action" onclick="verOperacaoAluno('${matricula}', '${key}')"><b>Operação:</b> ${infos.operacao}: Aluno reativado na turma ${infos.dados.turmaAtivacao}</button>`
                }
            }
        }
    }
    
}

function verOperacaoAluno(matricula, key) {
    const infos = alunos[matricula].historico[key]
    let corpo = `
        
    `
    abrirModal('modal', 'Visualização da operação ' + infos.operacao, corpo, `<button class="btn btn-secondary" data-dismiss="modal">Fechar</button>`)
}

function desativaAlunos(confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Desativando alunos...'
        let nomes = {}
        let turma
        for (const matricula in alunosSelecionadosTurma) {
            if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
                const aluno = alunosSelecionadosTurma[matricula];
                if (matricula == 'codTurma') {
                    turma = aluno
                } else if(matricula == undefined || aluno == undefined) {

                } else if(matricula != '') {
                    nomes[formataNumMatricula(matricula)] = aluno
                }
                
            }
        }
        let ativaDesativaAlunos = firebase.functions().httpsCallable('ativaDesativaAlunos')
        ativaDesativaAlunos({codTurma: alunosSelecionadosTurma.codTurma, modo: 'desativa', alunos: nomes}).then(function(result){
            loaderRun()
            AstNotif.dialog('Sucesso', result.data.answer)
            $('#modal').modal('hide')

        }).catch(function(error){
            AstNotif.dialog('Erro', error.message)
            loaderRun()
        })
    } else {
        let nomes = ''
        let turma
        for (const matricula in alunosSelecionadosTurma) {
            if (Object.hasOwnProperty.call(alunosSelecionadosTurma, matricula)) {
                const aluno = alunosSelecionadosTurma[matricula];
                if (matricula == 'codTurma') {
                    turma = aluno
                } else if(matricula == undefined || aluno == undefined) {

                } else {
                    nomes += formataNumMatricula(matricula) + ': ' + aluno + '<br>'
                }
                
            }
        }

        abrirModal('modal', 'Confirmação', 
        `Você está prestes à desativar o(s) aluno(s) que você selecionou da turma ${turma}.
            <br>
            ${nomes}
            <br><br>
            A desativação de um aluno consiste em desconectar o aluno das turmas e dos professores,
            mantendo seu cadastro no sistema, porém inativado. Esta ação não apaga nenhum dado, como histórico, notas,
            e informações cadastrais do aluno. Você poderá consultar alunos desativados na aba de "Alunos Desativados"
            da secretaria, bem como reativa-los na mesma aba.

            <br><br><b>Você deseja desativar os alunos selecionados?</b>
        `, 
        `<button type="button" data-toggle="tooltip" data-placement="top" title="A operação de desativação de alunos ficará gravada no sistema para futuras consultas." class="btn btn-warning" onclick="desativaAlunos(true)">Sim, Desativar</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancelar</button>`
        )
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })
    }
}

function gerarFichaAluno(matricula) {
    document.getElementById('corpoMatricula').innerHTML = `<iframe src="../resources/pdfsProntos/matriculaPdf.html#${matricula}" frameborder="0" width="100%" height="400px" id="fichaPdf" name="fichaPdf"></iframe>`
    $('#matriculaModal').modal({backdrop: 'static'})
}

// Funções da aba Alunos Desativados
var tipoDeBuscaDesativados = 'dadosAluno/nomeAluno'
var alunosDesativados

document.querySelector('#ordenaNomeDesativados').addEventListener('click', (e) => {
    tipoDeBuscaDesativados = 'dadosAluno/nomeAluno'
    carregaAlunosDesativados()
})
document.querySelector('#ordenaMatriculaDesativados').addEventListener('click', (e) => {
    carregaAlunosDesativados(true)
})
document.querySelector('#ordenaUltimaTurmaDesativados').addEventListener('click', (e) => {
    tipoDeBuscaDesativados = 'dadosAluno/turmaAluno'
    carregaAlunosDesativados()
})

function carregaAlunosDesativados(matricula=false,filtro='', numPrimeiros=20, numUltimos=20) {
    loader.style.display = 'block'
    loaderMsg.innerText = 'Carregando alunos desativados...'
    let alunosDesativadosRef = firebase.database().ref('sistemaEscolar/alunosDesativados')
    let listaAlunosDesativados = document.getElementById('listaAlunosDesativados')
    if (matricula) {
        alunosDesativadosRef = alunosDesativadosRef.orderByValue()
    } else {
        alunosDesativadosRef = alunosDesativadosRef.orderByChild(tipoDeBuscaDesativados)
        console.log(tipoDeBuscaDesativados)
    }
    
    alunosDesativadosRef.once('value').then(snapshot => {
        alunosDesativados = snapshot.val()
        loaderRun()
        let alunos = snapshot.val()
        listaAlunosDesativados.innerHTML = ''
        let c = 0
        for (const matricula in alunos) {
            if (Object.hasOwnProperty.call(alunos, matricula)) {
                const dados = alunos[matricula];
                c++
                listaAlunosDesativados.innerHTML += `
                
                <tr>
                    <td>
                        <span class="custom-checkbox">
                        <input type="checkbox" id="checkbox${c}" name="options[]" value="1">
                        <label for="checkbox${c}"></label>
                        </span>
                    </td>
                    <td><a href="#" onclick="abreDadosDoAlunoDesativado('${matricula}')">${dados.dadosAluno.nomeAluno}</a></td>
                    <td>${matricula}</td>
                    <td>${dados.dadosAluno.turmaAluno}</td>
                    <td>
                        <a href="#" class="action" onclick="ativarAluno('${matricula}')"><i data-feather="user-check" data-toggle="tooltip" title="Reativar Aluno"></i></a>
                        <a href="#deleteEmployeeModal" class="delete" data-toggle="modal"><i data-feather="trash" data-toggle="tooltip" title="Deletar aluno"></i></a>
                    </td>
                </tr>
                
                
                `
            }
        }
        feather.replace()
        $('[data-toggle="tooltip"]').tooltip();
        ativaCheckboxes()
        

    }).catch(error =>{ 
        AstNotif.dialog('Erro', error.message)
        loaderRun()
    })
    
    
}

function opcoesAlunoDesativado(matricula) {
    let dadosAluno = alunosDesativados[matricula].dadosAluno
    abrirModal('modal', 'Aluno desativado', 
        `
            ${dadosAluno.nomeAluno}, Nº de matrícula: ${matricula}, está desativado(a). 
            Você pode reativá-lo em alguma turma, ou pode simplesmente consultar os dados cadastrados no sistema.
            <br><br>
            <button type="button" class="btn btn-primary" data-dismiss="modal" onclick="abreDadosDoAlunoDesativado('${matricula}')">Ver dados do aluno</button>
            <button type="button" class="btn btn-info" onclick="ativarAluno('${matricula}')" data-toggle="tooltip" data-placement="top" title="A operação de Reativação de aluno ficará gravada no sistema para futuras consultas.">Reativar aluno</button>
        `,
        `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>`
    )
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
}

function ativarAluno(matricula, confirma=false) {
    if (confirma) {
        loader.style.display = 'block'
        loaderMsg.innerText = 'Reativando aluno na turma...'
        let ativaDesativaAlunos = firebase.functions().httpsCallable('ativaDesativaAlunos')
        let dadosAluno = alunosDesativados[matricula].dadosAluno
        let aluno = {}
        let selectTurmasAtiva = document.getElementById('selectTurmasAtiva')
        aluno[matricula] = dadosAluno.nomeAluno
        ativaDesativaAlunos({alunos: aluno, codTurma: selectTurmasAtiva.value, modo: 'ativa'}).then(function(result) {
            loaderRun()
            AstNotif.dialog('Sucesso', result.data.answer)
            $('#modal').modal('hide')
            carregaAlunosDesativados()
        }).catch(function(error){
            AstNotif.dialog('Erro', error.message)
            loaderRun()
        })
    } else {
        let dadosAluno = alunosDesativados[matricula].dadosAluno
        $('#modal').modal('hide')
        setTimeout(function(){
            abrirModal('modal', 'Confirmação', 
            `
                Você está prestes a reativar ${dadosAluno.nomeAluno}, Nº de matrícula ${matricula}.<br>
                Antes de ser desativado, este aluno era vinculado à turma ${dadosAluno.turmaAluno}.<br><br>
                <select class="custom-select" id="selectTurmasAtiva">
                    <option selected hidden>Escolha uma turma...</option>
                </select>
            `,
            `<button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button><button type="button" class="btn btn-primary"  onclick="ativarAluno('${matricula}', true)" data-toggle="tooltip" data-placement="top" title="A operação de Reativação de aluno ficará gravada no sistema para futuras consultas.">Reativar aluno</button>`
            )
            let selectTurmasAtiva = document.getElementById('selectTurmasAtiva')
            turmasRef.once('value').then(snapshot => {
                turmas = snapshot.val()
                for (const cod in turmas) {
                    if (Object.hasOwnProperty.call(turmas, cod)) {
                        const infoDaTurma = turmas[cod];
                        if (infoDaTurma.professor == undefined) {
                            var profReferencia = 'Não cadastrado'
                        } else {
                            var profReferencia = infoDaTurma.professor[0].nome
                        }
                        selectTurmasAtiva.innerHTML += `<option value="${cod}">Turma ${cod} (Prof. ${profReferencia})</option>`
                    }
                }
            }).catch(error => {
                AstNotif.dialog('Erro', error.message)
            })

        }, 600);
        
        
    }
    
}

function abreDadosDoAlunoDesativado(matricula) {
    let dadosAluno = alunosDesativados[matricula].dadosAluno
    let notas = alunosDesativados[matricula].dadosTurma.notas
    console.log(dadosAluno)
    document.getElementById('btnAbaAlunos').click()
    abreDadosDoAluno(matricula, dadosAluno, notas)

    
    setTimeout( function() {
        document.getElementById('rolaTelaAbaixoAlunos').style.display = 'block'
        document.getElementById('rolaTelaAbaixoAlunos').focus()
        document.getElementById('rolaTelaAbaixoAlunos').style.display = 'none'
      }, 300 );
    
}

function alteraTipoDeBuscaDesativados(tipo) {
    tipoDeBuscaDesativados = tipo
}

// Aba de Informações da Escola

function dadosInfoEscola() {
    let listaLivros = document.getElementById('listaLivros')
    let listaCursos = document.getElementById('listaCursos')
    infoEscolaRef.once('value').then(snapshot => {
        let dados = snapshot.val()
        if (dados != null) {
            document.getElementById('nomeEscola').value = dados.dadosBasicos.nomeEscola
            document.getElementById('frequenciaAprovacao').value = dados.dadosBasicos.frequenciaAprovacao
            document.getElementById('pontosAprovacao').value = dados.dadosBasicos.pontosAprovacao
        }  
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
    
    infoEscolaRef.child('livros').on('value', (snapshot) => {
        listaLivros.innerHTML = ''
        let livrosCadastrados = snapshot.val()
        for (const i in livrosCadastrados) {
            if (Object.hasOwnProperty.call(livrosCadastrados, i)) {
                const livro = livrosCadastrados[i];
                listaLivros.innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                                <input type="checkbox" id="checkbox${livro.codSistema}" name="options[]" value="${livro.codSistema}">
                                <label for="checkbox${livro.codSistema}"></label>
                            </span>
                        </td>
                        <td>${livro.idLivro}</td>
                        <td>${livro.nomeLivro}</td>
                        <td>${livro.codLivro}</td>
                        <td>
                            <a href="#modalAdicionaLivro" onclick="carregaDadosLivro('${livro.codSistema}')" class="edit" data-toggle="modal"><i data-feather="edit" data-toggle="tooltip" title="Editar livro">&#xE254;</i></a>
                            <a href="#deleteEmployeeModal" class="action" data-toggle="modal"><i data-feather="eye" data-toggle="tooltip" title="Ver Estatísticas"></i></a>
                        </td>
                    </tr>
                `
            }
        }
        
        feather.replace()
        ativaCheckboxes()
    })

    infoEscolaRef.child('cursos').on('value', (snapshot) => {
        listaCursos.innerHTML = ''
        let cursosCadastrados = snapshot.val()
        for (const i in cursosCadastrados) {
            if (Object.hasOwnProperty.call(cursosCadastrados, i)) {
                const curso = cursosCadastrados[i];
                listaCursos.innerHTML += `
                    <tr>
                        <td>
                            <span class="custom-checkbox">
                                <input type="checkbox" id="checkboxCurso${curso.codSistema}" name="cursos" value="${curso.codSistema}">
                                <label for="checkboxCurso${curso.codSistema}"></label>
                            </span>
                        </td>
                        <td>${curso.nomeCurso}</td>
                        <td></td>
                        <td>${curso.codCurso}</td>
                        <td>
                            <a href="#modalAdicionaCurso" onclick="carregaDadosCurso('${curso.codSistema}')" class="edit" data-toggle="modal"><i data-feather="edit" data-toggle="tooltip" title="Editar curso">&#xE254;</i></a>
                            <a href="#deleteEmployeeModal" class="action" data-toggle="modal"><i data-feather="eye" data-toggle="tooltip" title="Ver Estatísticas"></i></a>
                        </td>
                    </tr>
                `
            }
        }
        
        feather.replace()
        ativaCheckboxes()
    })

    infoEscolaRef.child('codDiasSemana').on('value', (snapshot) => {
        let i = 0
        let diasSemana = snapshot.val()
        document.getElementsByName('abrv').forEach(element => {
            element.value = diasSemana[i]
            i++
        });
    })
    
}

function carregaDadosLivro(codSistema) {
    infoEscolaRef.child('livros/' + codSistema).once('value').then(snapshot => {
        document.getElementById('idLivroAdd').value = snapshot.val().idLivro
        document.getElementById('nomeLivroAdd').value = snapshot.val().nomeLivro
        document.getElementById('codigoLivroAdd').value = snapshot.val().codLivro
        document.getElementById('codigoSistemaAdd').value = snapshot.val().codSistema
    })
}

function carregaDadosCurso(codSistema) {
    infoEscolaRef.child('cursos/' + codSistema).once('value').then(snapshot => {
        document.getElementById('nomeCursoAdd').value = snapshot.val().nomeCurso
        document.getElementById('codigoCursoAdd').value = snapshot.val().codCurso
        document.getElementById('codigoCursoSistemaAdd').value = snapshot.val().codSistema
    })
}

document.getElementById('infoEscolaForm').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let infoEscola = {}
    infoEscola.nomeEscola = dados.get('nomeEscola')
    infoEscola.frequenciaAprovacao = dados.get('frequenciaAprovacao')
    infoEscola.pontosAprovacao = dados.get('pontosAprovacao')
    loaderRun(true, 'Enviando dados básicos...')
    infoEscolaRef.child('dadosBasicos').set(infoEscola).then(() => {
        AstNotif.dialog('Sucesso', 'Os dados básicos foram atualizados e aplicados com sucesso.')
        loaderRun()
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
})

// Livros
document.getElementById('addLivroTabela').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let livro = {}
    livro.idLivro = dados.get('idLivroAdd')
    livro.nomeLivro = dados.get('nomeLivroAdd')
    livro.codLivro = dados.get('codigoLivroAdd')
    livro.codSistema = dados.get('codigoSistemaAdd')
    loaderRun(true, 'Enviando dados do livro...')
    infoEscolaRef.child('livros/' + livro.codSistema).set(livro).then(() => {
        AstNotif.notify('Livros Adicionados', 'Livros adicionados com sucesso', 'agora', {length: 5000})
        $('#modalAdicionaLivro').modal('hide')
        loaderRun()
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
})

function buscaProximoIdLivro() {
    let textBoxCodSistemaAdd = document.getElementById('codigoSistemaAdd')
    infoEscolaRef.child('livros').once('value').then(snapshot => {
        if (snapshot.val() != null) {
            let dados = snapshot.val()
            let c = 0
            for (const i in dados) {
                if (Object.hasOwnProperty.call(dados, i)) {
                    const livro = dados[i];
                    c++
                }
            }
            while (dados.hasOwnProperty(c)) {
                c++
            }
            textBoxCodSistemaAdd.value = c
        } else {
            textBoxCodSistemaAdd.value = 0
        }
        
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
}

document.getElementById('formListaLivros').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let livrosSelecionados = dados.getAll('options[]')
    if (livrosSelecionados.length == 0) {
        AstNotif.dialog('Opa...', 'Você esqueceu de selecionar os livros. Volte, e marque as caixas dos livros que deseja deletar.')
    } else {
       abrirModal('modal', 'Confirmação', 'Você confirma a exclusão dos livros selecionados?', '<button id="confirmaDeletaLivros" class="btn btn-danger">Sim</button><button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>')
       document.getElementById('confirmaDeletaLivros').addEventListener('click', (e) => {
           e.preventDefault()
           let c = 0
           for (const i in livrosSelecionados) {
               if (Object.hasOwnProperty.call(livrosSelecionados, i)) {
                   const codLivro = livrosSelecionados[i];
                   infoEscolaRef.child('livros/' + codLivro).remove().then(() => {
                    c++
                    if (c == livrosSelecionados.length) {
                        AstNotif.notify('Sucesso', 'Livros deletados com sucesso.', 'agora')
                        $('#modal').modal('hide')
                    }
                    
                   }).catch(error => {
                       AstNotif.dialog('Erro', error.message)
                       console.log(error)
                   })
               }
           }
       }) 
    }
    
})

// Cursos
document.getElementById('addCursoTabela').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let curso = {}
    curso.nomeCurso = dados.get('nomeCursoAdd')
    curso.codCurso = dados.get('codigoCursoAdd')
    curso.codSistema = dados.get('codigoCursoSistemaAdd')
    loaderRun(true, 'Enviando dados do Curso...')
    infoEscolaRef.child('cursos/' + curso.codSistema).set(curso).then(() => {
        AstNotif.notify('Cursos Adicionados', 'Cursos adicionados com sucesso', 'agora', {length: 5000})
        $('#modalAdicionaCurso').modal('hide')
        loaderRun()
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
})

function buscaProximoIdCurso() {
    let textBoxCodSistemaAdd = document.getElementById('codigoCursoSistemaAdd')
    infoEscolaRef.child('cursos').once('value').then(snapshot => {
        if (snapshot.val() != null) {
            let dados = snapshot.val()
            let c = 0
            for (const i in dados) {
                if (Object.hasOwnProperty.call(dados, i)) {
                    const curso = dados[i];
                    c++
                }
            }
            while (dados.hasOwnProperty(c)) {
                c++
            }
            textBoxCodSistemaAdd.value = c
        } else {
            textBoxCodSistemaAdd.value = 0
        }
        
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
        loaderRun()
    })
}

document.getElementById('formListaCursos').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let cursosSelecionados = dados.getAll('cursos')
    if (cursosSelecionados.length == 0) {
        AstNotif.dialog('Opa...', 'Você esqueceu de selecionar os cursos. Volte, e marque as caixas dos cursos que deseja deletar.')
    } else {
        abrirModal('modal', 'Confirmação', 'Você confirma a exclusão dos cursos selecionados?', '<button id="confirmaDeletaCursos" class="btn btn-danger">Sim</button><button class="btn btn-secondary" data-dismiss="modal">Cancelar</button>')
        document.getElementById('confirmaDeletaCursos').addEventListener('click', (e) => {
            e.preventDefault()
            let c = 0
            for (const i in cursosSelecionados) {
                if (Object.hasOwnProperty.call(cursosSelecionados, i)) {
                    const codCurso = cursosSelecionados[i];
                    infoEscolaRef.child('cursos/' + codCurso).remove().then(() => {
                        c++
                        if (c == cursosSelecionados.length) {
                            AstNotif.notify('Sucesso', 'Cursos deletados com sucesso.', 'agora')
                            $('#modal').modal('hide')
                        }
                    }).catch(error => {
                        AstNotif.dialog('Erro', error.message)
                        console.log(error)
                    })
                }
           }
       }) 
    }
    
})

// Cod Dias da Semana
document.getElementById('formCodDiasSemana').addEventListener('submit', (e) => {
    e.preventDefault()
    const dados = new FormData(e.target);
    let dias = dados.getAll('abrv')
    infoEscolaRef.child('codDiasSemana').set(dias).then(() => {
        AstNotif.notify('Sucesso', 'Códigos aplicados com sucesso. As próximas turmas serão criadas com base nestes códigos.', 'agora', {length: 30000})
    }).catch(error => {
        AstNotif.dialog('Erro', error.message)
        console.log(error)
    })
})