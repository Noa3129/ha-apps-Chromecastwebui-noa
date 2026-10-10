# Chromecast Remote Home Assistant App

Home Assistant OS向けのAppです。Home AssistantのAndroid TV Remote統合で作成した `remote.*` エンティティを操作します。

1. Android TV Remote統合をHome Assistantへ追加します。
2. このリポジトリをSettings > Apps > Repositoriesへ追加します。
3. Chromecast Remoteをインストールします。
4. AppのConfigurationで `remote_entity` に対象の `remote.*` エンティティを設定します。
5. Start後、「OPEN WEB UI」またはサイドバーのChromecast Remoteを開きます。

このAppはIngressとHome Assistant内部APIを使うため、Long-Lived Access Tokenの入力は不要です。AppsはHome Assistant OSでのみ利用できます。
