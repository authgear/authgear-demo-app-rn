.PHONY: npm-ci
npm-ci:
	npm ci

.PHONY: typecheck
typecheck:
	npm run typecheck

.PHONY: check-format
check-format:
	npm run prettier:check

.PHONY: format
format:
	npm run prettier:format

.PHONY: lint
lint:
	npm run lint

.PHONY: test
test:
	npm run test

.PHONY: pod-install
pod-install:
	cd ./ios; bundle exec pod install

.PHONY: ios-build-app
ios-build-app:
	bundle exec fastlane ios ios_build_app CURRENT_PROJECT_VERSION:$(shell date +%s)

.PHONY: ios-upload-app
ios-upload-app:
	bundle exec fastlane ios ios_upload_app

.PHONY: build-aab
build-aab:
	bundle exec fastlane android build_aab \
		VERSION_CODE:$(shell date +%s) \
		STORE_FILE:$(STORE_FILE) \
		STORE_PASSWORD:$(STORE_PASSWORD) \
		KEY_ALIAS:$(KEY_ALIAS) \
		KEY_PASSWORD:$(KEY_PASSWORD)

.PHONY:	upload-aab
upload-aab:
	bundle exec fastlane android upload_aab \
		json_key:$(GOOGLE_SERVICE_ACCOUNT_KEY_JSON_FILE)
