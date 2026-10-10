# Chromecast Remote PWA

参考モックのUIを維持した、Home Assistant Android TV Remote統合連携のiOS向けPWAです。ブラウザにはHAトークンを渡さず、同梱のNodeプロキシがHome Assistant REST APIの `remote.send_command` / `remote.turn_on` を呼び出します。設定未完了時は操作を送信できない旨を表示します。

## 起動

```sh
docker compose up --build -d
```

Docker版の外部ポートは`.env`の`APP_PORT`で変更できます。例えば`APP_PORT=9090`なら、アクセス先は`http://<LAN内IP>:9090/`です。アプリ起動ボタンは、以下の環境変数で2枠設定できます。未設定の場合は無地です。

```dotenv
APP_PORT=9090
APP_1_LABEL=YouTube
APP_1_IMAGE_URL=https://example.com/youtube.png
APP_1_DEEP_LINK=https://www.youtube.com
APP_2_LABEL=Netflix
APP_2_IMAGE_URL=https://example.com/netflix.png
APP_2_DEEP_LINK=https://www.netflix.com
```

Home Assistant OSでは、同梱のAppリポジトリ形式も利用できます。Settings > Apps > 右上メニュー > Repositoriesで、このリポジトリURLを追加し、「Chromecast Remote」をインストールしてください。AppのConfigurationで `remote_entity` に対象の `remote.*` エンティティを設定すると、Ingress経由でHome Assistantのサイドバーから開けます。AppsはHome Assistant OS専用です。

Home Assistant App版はホストのTCP 5090へ公開されます。LANからは `http://homeassistant.local:5090/` でアクセスできます。ポートを変える場合は`chromecast_remote/config.yaml`の`ports`のホスト側の値を変更し、Appのバージョンを更新してください。

押下時は視覚フィードバックを必ず表示し、`navigator.vibrate()`対応環境では短い振動も試行します。iOS Safari/PWAはWebからTaptic Engineを直接呼べないため、iOSでは視覚フィードバックが標準動作です。

直接公開ポートはHome Assistantのログイン画面を経由しません。Home AssistantのAPIトークンはApp内部に保持されますが、画面自体はLAN上の誰でも到達できるため、インターネットへポートフォワードしないでください。

起動前に `.env` を作成し、Home AssistantのURL、Long-Lived Access Token、Android TV Remoteのremoteエンティティを設定します。

```dotenv
HA_URL=http://homeassistant.local:8123
HA_TOKEN=ここにLong-Lived Access Token
HA_REMOTE_ENTITY=remote.living_room_tv
```

同一LANのiPhoneから、サーバーのLAN内IPを確認して `http://<LAN内IP>:8080/` をSafariで開きます。Windowsなら `ipconfig`、macOS/Linuxなら `ip addr` でIPv4アドレスを確認できます。DockerホストとiPhoneが同じWi-Fiに接続され、TCP 8080がファイアウォールで許可されている必要があります。

## iPhoneのホーム画面へ追加

SafariでURLを開き、共有ボタン → 「ホーム画面に追加」 → 名前を確認 → 「追加」を選びます。起動時は `display: standalone` とApple向けメタタグにより、アドレスバーなしの独立表示になります。

## HTTP / HTTPS

UI表示、押下フィードバック、Home Assistant API通信、テーマ切り替えはHTTPでも利用できます。Service Workerとキャッシュは、通常のSafariではHTTPSが必要ですが、API通信自体は同一LANのHTTPでも動作します。iOSの実機でLAN内HTTPを使う場合、Service Workerやホーム画面追加の挙動はiOS/Safariの条件により利用できないことがあります。その場合も通常のWeb画面としてフォールバックします。必要なら既存リバースプロキシでHTTPS終端し、プロキシからこのコンテナへ接続してください。HTTPSへの自動リダイレクトは行いません。

## 変更・追加ファイル

- `index.html`, `styles.css`, `app.js`: UI、レスポンシブレイアウト、操作フィードバック、Home Assistant接続状態表示
- `server.mjs`: Home Assistant REST APIプロキシ。トークンをブラウザへ公開しない
- `manifest.webmanifest`, `icons/*`: PWAマニフェストとアイコン
- `sw.js`: 静的ファイルのキャッシュ。非対応時は通常表示へフォールバック
- `Dockerfile`, `docker-compose.yml`: LAN配信用HTTPサーバー

## 検証

静的ファイルのパス、Nodeプロキシの構成、CSSの縦画面・短い画面・横幅広画面向け分岐、ボタンのPointer Eventsと`:active`、ミュート状態、オフライン表示をコード上で確認しています。iOS実機、実際のホーム画面追加、Home Assistant実機通信、HTTPSリバースプロキシ環境はこの環境から未検証です。
