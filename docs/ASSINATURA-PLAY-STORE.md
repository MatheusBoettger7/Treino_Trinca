# Assinatura do App na Google Play

A branch `producao` está preparada para gerar o App Bundle (`.aab`) assinado com a **chave de upload** armazenada de forma protegida no GitHub Actions.

A chave privada **não deve ser commitada no repositório**. O workflow recria o keystore apenas durante o build e o remove ao final.

## 1. Gerar a chave de upload localmente

No computador onde a chave ficará guardada:

```powershell
keytool -genkeypair -v -keystore treino-trinca-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias treino-trinca-upload
```

Guarde o arquivo `treino-trinca-upload.jks` em um local seguro, fora do repositório.

Para gerar o certificado público que será necessário no Play Console:

```powershell
keytool -export -rfc -keystore treino-trinca-upload.jks -alias treino-trinca-upload -file treino-trinca-upload-cert.pem
```

O certificado `.pem` contém apenas a parte pública. A senha e o arquivo `.jks` são privados.

## 2. Cadastrar os segredos no GitHub

Na configuração do repositório, use o ambiente **producao** e crie estes secrets:

```text
ANDROID_KEYSTORE_BASE64
ANDROID_KEYSTORE_PASSWORD
ANDROID_KEY_ALIAS
ANDROID_KEY_PASSWORD
```

Para converter o `.jks` em Base64 no PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes(".\treino-trinca-upload.jks"))
```

Cole o resultado somente no secret `ANDROID_KEYSTORE_BASE64`.

Os demais valores são a senha do keystore, o alias e a senha da chave.

## 3. Build

Ao executar o workflow **Build Android Play Bundle** na branch `producao`, ele:

1. valida os quatro secrets;
2. restaura temporariamente o `.jks`;
3. gera o `bundleRelease` assinado;
4. publica o `.aab` como artefato;
5. remove o keystore do runner.

O artefato será nomeado:

```text
Treino-Trinca-v2026.09.30.61-release-signed.aab
```

## 4. Google Play

Para um app novo, a Google Play usa a **Assinatura de Apps do Google Play**: a chave de upload é mantida pelo desenvolvedor e usada para enviar o pacote; a chave de assinatura do app é gerenciada pela Google Play. O certificado público da chave de upload é o que deve ser associado ao app no Play Console.

Nunca envie o arquivo `.jks`, as senhas ou a chave privada para o repositório.
