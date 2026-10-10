# Chromecast Remote Home Assistant App

Home Assistant OS向けのAppです。Home AssistantのAndroid TV Remote統合で作成した `remote.*` エンティティを操作します。

1. Android TV Remote統合をHome Assistantへ追加します。
2. このリポジトリをSettings > Apps > Repositoriesへ追加します。
3. Chromecast Remoteをインストールします。
4. AppのConfigurationで `remote_entity` に対象の `remote.*` エンティティを設定します。
5. `app_1_*` と `app_2_*` に、ボタンの文字列、画像URL、ディープリンクを設定します。未設定のボタンは無地で表示されます。
6. Start後、「OPEN WEB UI」またはサイドバーのChromecast Remoteを開きます。

LANから直接開く場合は `http://homeassistant.local:5090/` です。直接ポートはHome Assistantのログイン画面を経由しないため、信頼できるLAN内だけで公開してください。ホストポートを変更する場合は、`config.yaml`の`ports`にある`5090`を変更し、Appのバージョンを上げて更新してください。Ingressの内部ポートは9090です。

このAppはIngress（内部ポート9090）とHome Assistant内部APIを使うため、Long-Lived Access Tokenの入力は不要です。AppsはHome Assistant OSでのみ利用できます。
