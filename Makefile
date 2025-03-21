.PHONY: npm-ci
npm-ci:
	npm ci

.PHONY: pod-install
pod-install:
	cd ./ios; bundle exec pod install

.PHONY: fastlane-api-key-json
fastlane-api-key-json:
	mkdir -p ./build
	jq --slurp --raw-input > ./build/fastlane-api-key.json \
		--arg key_id $(API_KEY) \
		--arg issuer_id $(API_ISSUER) \
		'{key_id: $$key_id, issuer_id: $$issuer_id, key: .}' \
		$(API_KEY_PATH)

.PHONY: ios-build-app
ios-build-app:
	bundle exec fastlane ios_build_app CURRENT_PROJECT_VERSION:$(shell date +%s)

.PHONY: ios-upload-app
ios-upload-app:
	bundle exec fastlane ios_upload_app
