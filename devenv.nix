{ pkgs, lib, config, inputs, ... }:

let
  pkgs-unstable = import inputs.nixpkgs-unstable { system = pkgs.stdenv.system; };
  pkgs-playwright = import inputs.nixpkgs-playwright { system = pkgs.stdenv.system; };
  browsers = (builtins.fromJSON (builtins.readFile "${pkgs-playwright.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium") browsers)).revision;
in {
  scripts.patch-sass-embedded.exec = ''
  find node_modules/.pnpm/sass-embedded-linux-*/node_modules/sass-embedded-linux-*/dart-sass/src -name dart -print0 | xargs -I {} -0 patchelf --set-interpreter "$(<$NIX_CC/nix-support/dynamic-linker)" {}
  '';

	packages = with pkgs-unstable; [
    # General tools
    git-cliff 
    actionlint
    crowdin-cli
    nfpm
    # API tools
    golangci-lint mage
    # Desktop
    electron
    # Font processing tools
    wget
    python3
    python3Packages.pip
    python3Packages.fonttools
    python3Packages.brotli
    nodejs
  ];
  
  languages = {
    javascript = {
      enable = true;
      package = pkgs-unstable.nodejs-slim;
      pnpm = {
        enable = true;
        package = pkgs-unstable.pnpm;
      };
    };
    
    go = {
      enable = true;
      package = pkgs-unstable.go;
			enableHardeningWorkaround = true;
    };
  };
  
  services.mailpit = {
    enable = true;
    package = pkgs-unstable.mailpit;
  };
  
  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs-playwright.playwright.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs}/bin/node";
    PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = "${pkgs-playwright.playwright.browsers}/chromium-${chromium-rev}/chrome-linux/chrome";
    VIKUNJA_SERVICE_TESTINGTOKEN = "test";
  };
  
  scripts.playwright-setup-nix.exec = ''
    playwrightNpmVersion="$(pnpm show @playwright/test version)"
    echo "❄️ Playwright nix version: ${pkgs-playwright.playwright.version}"
    echo "📦 Playwright npm version: $playwrightNpmVersion"

    if [ "${pkgs-playwright.playwright.version}" != "$playwrightNpmVersion" ]; then
        echo "❌ Playwright versions in nix (in devenv.yaml) and npm (in package.json) are not the same! Please adapt the configuration."
    else
        echo "✅ Playwright versions in nix and npm are the same"
    fi

    echo
    env | grep ^PLAYWRIGHT
  '';

  enterShell = ''
    playwright-setup-nix
  '';
	
	devcontainer = {
		enable = true;
		settings = {
			forwardPorts = [ 4173 3456 ];
			portsAttributes = {
				"4173" = {
					label = "Vikunja Frontend dev server";
				};
				"3456" = {
					label = "Vikunja API";
				};
			};
			customizations.vscode.extensions = [
        "Syler.sass-indented"
        "codezombiech.gitignore"
        "dbaeumer.vscode-eslint"
        "editorconfig.editorconfig"
        "golang.Go"
        "lokalise.i18n-ally"
        "mikestead.dotenv"
        "mkhl.direnv"
        "vitest.explorer"
        "vue.volar"
			];
		};
	};
}
