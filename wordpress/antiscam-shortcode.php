<?php
/**
 * Plugin Name: Cyberpedia Anti-Truffa Tool
 * Description: Shortcode [antiscam-tool] per integrare l'Anti-Truffa Tool via iframe responsivo.
 * Version: 1.0.0
 * Author: Cyberpedia.it
 * License: MIT
 *
 * Usage: inserisci [antiscam-tool] in qualsiasi pagina o articolo WordPress.
 *
 * L'iframe punta a Cloudflare Pages e si ridimensiona automaticamente
 * tramite postMessage, eliminando scrollbar interne.
 */

if (!defined('ABSPATH')) {
    exit; // Prevent direct access
}

/**
 * Register the [antiscam-tool] shortcode.
 */
function cyberpedia_antiscam_shortcode($atts) {
    $atts = shortcode_atts(array(
        'url'        => 'https://cyberpedia-antiscam-tool.pages.dev',
        'min_height' => '600',
    ), $atts, 'antiscam-tool');

    $url        = esc_url($atts['url']);
    $min_height = intval($atts['min_height']);
    $iframe_id  = 'antiscam-iframe';

    // Inline CSS for the responsive container
    $css = "
        .antiscam-wrapper {
            position: relative;
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
            overflow: hidden;
        }
        .antiscam-wrapper iframe {
            width: 100%;
            min-height: {$min_height}px;
            border: none;
            display: block;
            transition: height 0.2s ease-out;
        }
    ";

    // Inline JS for postMessage resize listener
    $js = "
    (function() {
        var iframe = document.getElementById('{$iframe_id}');
        if (!iframe) return;

        var allowedOrigin = '{$url}'.replace(/\/$/, '');

        window.addEventListener('message', function(event) {
            // Security: only accept messages from our Cloudflare Pages origin
            if (event.origin !== allowedOrigin) return;

            var data = event.data;
            if (data && data.type === 'antiscam-resize' && typeof data.height === 'number') {
                iframe.style.height = data.height + 'px';
            }
        });
    })();
    ";

    $output  = '<style>' . $css . '</style>';
    $output .= '<div class="antiscam-wrapper">';
    $output .= '<iframe';
    $output .= ' id="' . esc_attr($iframe_id) . '"';
    $output .= ' src="' . $url . '"';
    $output .= ' title="Anti-Truffa Tool — Cyberpedia"';
    $output .= ' loading="lazy"';
    $output .= ' allow="clipboard-write"';
    $output .= ' sandbox="allow-scripts allow-same-origin allow-popups allow-forms"';
    $output .= ' style="height: ' . $min_height . 'px;"';
    $output .= '></iframe>';
    $output .= '</div>';
    $output .= '<script>' . $js . '</script>';

    return $output;
}
add_shortcode('antiscam-tool', 'cyberpedia_antiscam_shortcode');
